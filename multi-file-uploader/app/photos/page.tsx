"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BASE_URL } from "@/config";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  Download,
  Eye,
  FileImage,
  Folder,
  Grid3X3,
  Images,
  List,
  RefreshCw,
  Search,
  Square,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

interface PhotoFile {
  name: string;
  url: string;
  downloadUrl: string;
  size?: number;
  lastModified?: Date;
}

const PhotosPage: React.FC = () => {
  const [directory, setDirectory] = useState("");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<string>>(
    new Set()
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);

  useEffect(() => {
    // Load saved directory preference
    const savedDirectory = localStorage.getItem("uploadDirectory");
    if (savedDirectory) {
      setDirectory(savedDirectory);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    if (!directory.trim()) {
      setError("Please enter a directory path");
      return;
    }

    setLoading(true);
    setError("");
    setPhotos([]);
    setSelectedForDownload(new Set());
    setIsSelectionMode(false);

    try {
      const response = await axios.get(`${BASE_URL}/photos`, {
        params: { dir: directory.trim() },
      });

      const photoFiles: PhotoFile[] = response.data.files.map(
        (filename: string) => ({
          name: filename,
          url: `${BASE_URL}/files/${directory.trim()}/${filename}`,
          downloadUrl: `${BASE_URL}/download/${directory.trim()}/${filename}`,
        })
      );

      setPhotos(photoFiles);
      localStorage.setItem("uploadDirectory", directory.trim());
    } catch (err: any) {
      console.error("Error fetching photos:", err);
      if (err.response?.status === 404) {
        setError("Directory not found. Please check the path and try again.");
      } else if (err.response?.status === 400) {
        setError("Directory path is required");
      } else {
        setError("Failed to load photos. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [directory]);

  const handleDirectorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPhotos();
  };

  const filteredPhotos = photos.filter((photo) =>
    photo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedForDownload(new Set());
    }
  };

  const togglePhotoSelection = (photoName: string) => {
    const newSelected = new Set(selectedForDownload);
    if (newSelected.has(photoName)) {
      newSelected.delete(photoName);
    } else {
      newSelected.add(photoName);
    }
    setSelectedForDownload(newSelected);
  };

  const selectAllPhotos = () => {
    if (selectedForDownload.size === filteredPhotos.length) {
      setSelectedForDownload(new Set());
    } else {
      setSelectedForDownload(
        new Set(filteredPhotos.map((photo) => photo.name))
      );
    }
  };

  const downloadSinglePhoto = async (photo: PhotoFile) => {
    try {
      const response = await fetch(photo.downloadUrl, {
        method: "GET",
        headers: {
          Accept: "image/*",
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = photo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      const link = document.createElement("a");
      link.href = photo.downloadUrl;
      link.download = photo.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadSelectedPhotos = async () => {
    if (selectedForDownload.size === 0) return;

    setDownloading(true);

    try {
      if (selectedForDownload.size === 1) {
        // Single file download
        const photoName = Array.from(selectedForDownload)[0];
        const photo = photos.find((p) => p.name === photoName);
        if (photo) {
          await downloadSinglePhoto(photo);
        }
      } else {
        // Multiple files - download one by one with delay
        const selectedPhotos = photos.filter((photo) =>
          selectedForDownload.has(photo.name)
        );

        for (let i = 0; i < selectedPhotos.length; i++) {
          const photo = selectedPhotos[i];
          await downloadSinglePhoto(photo);

          // Add small delay between downloads to prevent browser blocking
          if (i < selectedPhotos.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      // Clear selection after successful download
      setSelectedForDownload(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Batch download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const openPhotoModal = (photoUrl: string) => {
    if (!isSelectionMode) {
      setSelectedPhoto(photoUrl);
    }
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  const isAllSelected =
    selectedForDownload.size === filteredPhotos.length &&
    filteredPhotos.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-sm sm:max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Upload
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
              Photo Gallery
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Browse and manage your uploaded images
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="p-2"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="p-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* CORS Warning */}
        <Alert className="border-yellow-200 bg-yellow-50 mx-2 sm:mx-0">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            <strong>Server Setup Required:</strong> To view and download images,
            your server needs these endpoints:
            <br />
            <code className="text-xs bg-yellow-100 px-1 rounded">
              GET /files/:dir/:filename
            </code>{" "}
            - Serve images with proper CORS headers
            <br />
            <code className="text-xs bg-yellow-100 px-1 rounded">
              GET /download/:dir/:filename
            </code>{" "}
            - Download files with attachment headers
          </AlertDescription>
        </Alert>

        {/* Directory Input Card */}
        <Card className="shadow-lg mx-2 sm:mx-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Folder className="h-4 w-4 sm:h-5 sm:w-5" />
              Browse Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDirectorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="directory"
                  className="text-sm font-medium text-gray-700"
                >
                  Directory Path
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="directory"
                    type="text"
                    placeholder="e.g., photos/2024/january or uploads/images"
                    value={directory}
                    onChange={(e) => setDirectory(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !directory.trim()}
                    className="px-4"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Search Bar */}
            {photos.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-gray-700"
                >
                  Search Photos
                </Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50 mx-2 sm:mx-0">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Photos Stats */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 sm:px-0">
            <Badge variant="secondary" className="text-xs sm:text-sm px-2 py-1">
              Total: {photos.length} photos
            </Badge>
            <Badge
              variant="outline"
              className="text-xs sm:text-sm px-2 py-1 flex items-center gap-1"
            >
              <Folder className="h-3 w-3" />
              {directory}
            </Badge>
            {searchTerm && (
              <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
                Filtered: {filteredPhotos.length} photos
              </Badge>
            )}
          </div>
        )}

        {/* Selection Controls */}
        {photos.length > 0 && (
          <Card className="shadow-lg mx-2 sm:mx-0 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSelectionMode}
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      isSelectionMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    }`}
                  >
                    {isSelectionMode ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {isSelectionMode ? "Exit Selection" : "Select Photos"}
                  </Button>

                  {isSelectionMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllPhotos}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {isAllSelected ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <CheckSquare className="h-4 w-4" />
                      )}
                      {isAllSelected ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                {selectedForDownload.size > 0 && (
                  <div className="flex items-center gap-3 animate-in slide-in-from-right-5 duration-300">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full">
                      <CheckSquare className="h-3 w-3" />
                      <span className="text-sm font-medium">
                        {selectedForDownload.size} selected
                      </span>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={downloadSelectedPhotos}
                      disabled={downloading}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200"
                    >
                      {downloading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {downloading
                        ? "Downloading..."
                        : `Download ${selectedForDownload.size}`}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedForDownload(new Set())}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos Grid/List */}
        {filteredPhotos.length > 0 && (
          <Card className="shadow-lg mx-2 sm:mx-0 border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Images className="h-4 w-4 sm:h-5 sm:w-5" />
                Photos ({filteredPhotos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.name}
                      className={`group relative bg-gray-100 rounded-xl overflow-hidden aspect-square transition-all duration-300 ${
                        selectedForDownload.has(photo.name)
                          ? "ring-3 ring-blue-500 ring-offset-2 shadow-lg scale-[0.98] transform"
                          : "hover:shadow-md hover:scale-[1.02] transform"
                      }`}
                    >
                      {/* Custom Selection Indicator */}
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 z-20">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePhotoSelection(photo.name);
                            }}
                            className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-200 flex items-center justify-center ${
                              selectedForDownload.has(photo.name)
                                ? "bg-blue-600 border-blue-600 shadow-lg scale-110"
                                : "bg-white/90 border-gray-300 hover:border-blue-400 hover:bg-blue-50 backdrop-blur-sm"
                            }`}
                          >
                            {selectedForDownload.has(photo.name) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}

                      <img
                        src={photo.url || "/placeholder.svg"}
                        alt={photo.name}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          isSelectionMode ? "cursor-pointer" : "cursor-pointer"
                        } ${
                          selectedForDownload.has(photo.name)
                            ? "brightness-90"
                            : ""
                        }`}
                        onClick={() => {
                          if (isSelectionMode) {
                            togglePhotoSelection(photo.name);
                          } else {
                            openPhotoModal(photo.url);
                          }
                        }}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "/placeholder.svg?height=200&width=200&text=Image+Error";
                        }}
                        crossOrigin="anonymous"
                      />

                      {/* Hover Actions (only in non-selection mode) */}
                      {/* //! Uncomment show the grid image hover view and download button */}
                      {/* {!isSelectionMode && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <div className="flex gap-3">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPhotoModal(photo.url);
                              }}
                              className="p-3 h-auto bg-white/95 hover:bg-white text-gray-700 backdrop-blur-sm shadow-lg rounded-full transition-all duration-200 hover:scale-110"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSinglePhoto(photo);
                              }}
                              className="p-3 h-auto bg-white/95 hover:bg-white text-gray-700 backdrop-blur-sm shadow-lg rounded-full transition-all duration-200 hover:scale-110"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )} */}

                      {/* Filename overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs font-medium truncate">
                          {photo.name}
                        </p>
                      </div>

                      {/* Selection overlay */}
                      {selectedForDownload.has(photo.name) && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg animate-in zoom-in-50 duration-200">
                            <CheckSquare className="h-6 w-6" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.name}
                      onClick={() => {
                        if (isSelectionMode) {
                          togglePhotoSelection(photo.name);
                        }
                      }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                        isSelectionMode ? "cursor-pointer" : ""
                      } ${
                        selectedForDownload.has(photo.name)
                          ? "bg-blue-50 border-2 border-blue-200 shadow-sm"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      {/* Custom Selection Checkbox for List View */}
                      {isSelectionMode && (
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePhotoSelection(photo.name);
                          }}
                          className={`w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                            selectedForDownload.has(photo.name)
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {selectedForDownload.has(photo.name) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      )}

                      <div className="flex-shrink-0">
                        <img
                          src={photo.url || "/placeholder.svg"}
                          alt={photo.name}
                          className="w-14 h-14 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                          onClick={(e) => {
                            if (isSelectionMode) {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePhotoSelection(photo.name);
                            } else {
                              openPhotoModal(photo.url);
                            }
                          }}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "/placeholder.svg?height=56&width=56&text=Error";
                          }}
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {photo.name}
                        </p>
                        <p className="text-xs text-gray-500">Image file</p>
                      </div>
                      {!isSelectionMode && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPhotoModal(photo.url);
                            }}
                            className="p-2 h-auto hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadSinglePhoto(photo);
                            }}
                            className="p-2 h-auto hover:bg-green-50 hover:text-green-600"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && photos.length === 0 && directory && !error && (
          <Card className="shadow-lg mx-2 sm:mx-0">
            <CardContent className="text-center py-12">
              <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No photos found
              </h3>
              <p className="text-gray-500 mb-4">
                The directory "{directory}" exists but contains no image files.
              </p>
              <Link href="/">
                <Button variant="outline">Upload Photos</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="shadow-lg mx-2 sm:mx-0">
            <CardContent className="text-center py-12">
              <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading photos...
              </h3>
              <p className="text-gray-500">
                Fetching images from "{directory}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closePhotoModal}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={selectedPhoto || "/placeholder.svg"}
              alt="Full size preview"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "/placeholder.svg?height=400&width=400&text=Image+Load+Error";
              }}
            />

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Find the photo object for download
                  const photo = filteredPhotos.find(
                    (p) => p.url === selectedPhoto
                  );
                  if (photo) {
                    downloadSinglePhoto(photo);
                  }
                }}
                className="p-2 bg-white/90 hover:bg-white text-gray-700 backdrop-blur-sm shadow-lg rounded-full transition-all duration-200 hover:scale-110"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Open in new tab for full view
                  window.open(selectedPhoto, "_blank");
                }}
                className="p-2 bg-white/90 hover:bg-white text-gray-700 backdrop-blur-sm shadow-lg rounded-full transition-all duration-200 hover:scale-110"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={closePhotoModal}
                className="p-2 bg-white/90 hover:bg-white text-gray-700 backdrop-blur-sm shadow-lg rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button - Selection Mode */}
      {isSelectionMode && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5 duration-300">
          {/* Simple Floating Button */}
          <div className="relative">
            <Button
              onClick={() => setShowSelectionMenu(!showSelectionMenu)}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 p-0 flex items-center justify-center"
            >
              <CheckSquare className="h-6 w-6" />
            </Button>

            {/* Selection count badge */}
            {selectedForDownload.size > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium shadow-lg animate-in zoom-in-50 duration-200">
                {selectedForDownload.size}
              </div>
            )}
          </div>

          {/* Expandable Menu */}
          {showSelectionMenu && (
            <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[240px] animate-in slide-in-from-bottom-3 duration-200">
              {/* Menu Header */}
              <div className="px-3 py-2 border-b border-gray-100 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Selection Mode
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedForDownload.size} of {filteredPhotos.length}{" "}
                      selected
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSelectionMenu(false)}
                    className="p-1 h-auto w-auto text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {/* Select All / Deselect All */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    selectAllPhotos();
                    setShowSelectionMenu(false);
                  }}
                  className="w-full flex items-center justify-start gap-3 px-3 py-2 h-auto text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {isAllSelected ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <CheckSquare className="h-4 w-4" />
                  )}
                  <span className="flex-1 text-left">
                    {isAllSelected ? "Deselect All" : "Select All"}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({filteredPhotos.length})
                  </span>
                </Button>

                {/* Download Selected - Only show if photos are selected */}
                {selectedForDownload.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      downloadSelectedPhotos();
                      setShowSelectionMenu(false);
                    }}
                    disabled={downloading}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2 h-auto text-green-700 hover:bg-green-50 rounded-lg disabled:opacity-50"
                  >
                    {downloading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span className="flex-1 text-left">
                      {downloading ? "Downloading..." : "Download Selected"}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      {selectedForDownload.size}
                    </span>
                  </Button>
                )}

                {/* Clear Selection - Only show if photos are selected */}
                {selectedForDownload.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedForDownload(new Set());
                      setShowSelectionMenu(false);
                    }}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2 h-auto text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                    <span className="flex-1 text-left">Clear Selection</span>
                  </Button>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 my-2" />

                {/* Exit Selection Mode */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toggleSelectionMode();
                    setShowSelectionMenu(false);
                  }}
                  className="w-full flex items-center justify-start gap-3 px-3 py-2 h-auto text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="flex-1 text-left">Exit Selection</span>
                </Button>
              </div>

              {/* Download Progress */}
              {downloading && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>
                      Downloading {selectedForDownload.size} photos...
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full transition-all duration-300 animate-pulse"
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Click outside to close menu */}
          {showSelectionMenu && (
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setShowSelectionMenu(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PhotosPage;
