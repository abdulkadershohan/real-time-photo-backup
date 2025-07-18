"use client";

import { OfflineIndicator } from "@/components/offline-indicator";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileImage,
  Folder,
  Loader2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";

interface FileWithProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  id: string;
}

interface UploadStats {
  startTime: number;
  endTime?: number;
  totalBytes: number;
  uploadedBytes: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

const App: React.FC = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [directory, setDirectory] = useState("");
  const [directoryError, setDirectoryError] = useState("");

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("uploadedNames");
    if (saved) {
      setUploaded(JSON.parse(saved));
    }

    // Load saved directory preference
    const savedDirectory = localStorage.getItem("uploadDirectory");
    if (savedDirectory) {
      setDirectory(savedDirectory);
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return (
      Number.parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) +
      " " +
      sizes[i]
    );
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = milliseconds / 1000;
    if (seconds < 1) {
      return `${Math.round(milliseconds)}ms`;
    }
    return formatTime(seconds);
  };

  const validateDirectory = (dir: string): boolean => {
    if (!dir.trim()) {
      setDirectoryError("Directory path is required");
      return false;
    }

    // Basic validation for directory path
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(dir)) {
      setDirectoryError("Directory contains invalid characters");
      return false;
    }

    setDirectoryError("");
    return true;
  };

  const handleDirectoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDirectory(value);

    if (value.trim()) {
      validateDirectory(value);
    } else {
      setDirectoryError("Directory path is required");
    }

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("uploadDirectory", value);
    }
  };

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selected = Array.from(e.target.files);
        const newFiles = selected
          .filter((file) => !uploaded.includes(file.name))
          .map((file) => ({
            file,
            progress: 0,
            status: "pending" as const,
            id: Math.random().toString(36).substr(2, 9),
          }));

        setFiles((prev) => [...prev, ...newFiles]);
        setMessage(null);
      }
    },
    [uploaded]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setShowAllFiles(false);
    setMessage(null);
    setUploadStats(null);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Validate directory before upload
    if (!validateDirectory(directory)) {
      return;
    }

    if (!isOnline) {
      setMessage({
        type: "error",
        text: "You're offline. Please check your connection and try again.",
      });
      return;
    }

    const totalBytes = files.reduce((sum, file) => sum + file.file.size, 0);
    const startTime = Date.now();

    setIsUploading(true);
    setUploadProgress(0);
    setMessage(null);
    setUploadStats({
      startTime,
      totalBytes,
      uploadedBytes: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
    });

    try {
      const formData = new FormData();

      // Add directory to form data
      formData.append("dir", directory.trim());

      // Add files to form data
      files.forEach(({ file }) => formData.append("photos", file));

      // Update all files to uploading status
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading" as const }))
      );

      let lastTime = startTime;
      let lastLoaded = 0;

      const response = await axios.post(
        "http://192.168.0.101:3000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const currentTime = Date.now();
              const timeElapsed = (currentTime - startTime) / 1000; // seconds
              const timeSinceLastUpdate = (currentTime - lastTime) / 1000; // seconds
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              const uploadedBytes = progressEvent.loaded;

              // Calculate speed (bytes per second)
              let currentSpeed = 0;
              if (timeSinceLastUpdate > 0) {
                const bytesInInterval = uploadedBytes - lastLoaded;
                currentSpeed = bytesInInterval / timeSinceLastUpdate;
              }

              // Calculate average speed
              const averageSpeed =
                timeElapsed > 0 ? uploadedBytes / timeElapsed : 0;

              // Calculate estimated time remaining
              const remainingBytes = totalBytes - uploadedBytes;
              const estimatedTimeRemaining =
                averageSpeed > 0 ? remainingBytes / averageSpeed : 0;

              setUploadProgress(progress);
              setUploadStats((prev) => ({
                ...prev!,
                uploadedBytes,
                speed: averageSpeed,
                estimatedTimeRemaining,
              }));

              // Update individual file progress
              setFiles((prev) =>
                prev.map((f) => ({
                  ...f,
                  progress: progress,
                  status:
                    progress === 100
                      ? ("completed" as const)
                      : ("uploading" as const),
                }))
              );

              lastTime = currentTime;
              lastLoaded = uploadedBytes;
            }
          },
        }
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Mark all files as completed
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "completed" as const, progress: 100 }))
      );

      // Update final stats
      setUploadStats((prev) => ({
        ...prev!,
        endTime,
        uploadedBytes: totalBytes,
      }));

      const newUploaded = [...uploaded, ...files.map((f) => f.file.name)];
      if (typeof window !== "undefined") {
        localStorage.setItem("uploadedNames", JSON.stringify(newUploaded));
      }
      setUploaded(newUploaded);

      setMessage({
        type: "success",
        text: `Successfully uploaded ${
          files.length
        } file(s) to "${directory}" in ${formatDuration(totalTime)}`,
      });

      // Show notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Upload Complete!", {
          body: `Successfully uploaded ${
            files.length
          } file(s) to "${directory}" in ${formatDuration(totalTime)}`,
          icon: "/icons/icon-192x192.png",
        });
      }

      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        setUploadStats(null);
      }, 5000); // Show stats for 5 seconds
    } catch (err) {
      console.error(err);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error" as const })));
      setMessage({ type: "error", text: "Upload failed. Please try again." });
      setUploadStats(null);
    } finally {
      setIsUploading(false);
    }
  };

  const pendingFiles = files.filter((f) => f.status === "pending");
  const uploadingFiles = files.filter((f) => f.status === "uploading");
  const completedFiles = files.filter((f) => f.status === "completed");
  const errorFiles = files.filter((f) => f.status === "error");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Responsive text sizing */}
        <div className="text-center px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Photo Uploader PWA
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Upload multiple images with progress tracking - works offline
          </p>
        </div>

        <Card className="shadow-lg mx-2 sm:mx-0">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              File Upload
              {!isOnline && (
                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Directory Input - Required Field */}
            <div className="space-y-2">
              <Label
                htmlFor="directory"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Folder className="h-4 w-4" />
                Upload Directory
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="directory"
                type="text"
                placeholder="e.g., photos/2024/january or uploads/images"
                value={directory}
                onChange={handleDirectoryChange}
                disabled={isUploading}
                className={`${
                  directoryError
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                onBlur={(e) => validateDirectory(e.target.value)}
              />
              {directoryError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {directoryError}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Specify where you want to store the uploaded images on the
                server
              </p>
            </div>

            {/* Upload Area - Responsive padding and sizing */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 lg:p-8 text-center hover:border-gray-400 transition-colors">
              <FileImage className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
              <div className="space-y-1 sm:space-y-2">
                <p className="text-base sm:text-lg font-medium text-gray-700">
                  Choose images to upload
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Select multiple files at once
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleChange}
                className="mt-3 sm:mt-4 block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isUploading}
              />
            </div>

            {/* Stats - Responsive badge layout */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs sm:text-sm px-2 py-1"
                >
                  Total: {files.length}
                </Badge>
                {directory && (
                  <Badge
                    variant="outline"
                    className="text-xs sm:text-sm px-2 py-1 flex items-center gap-1"
                  >
                    <Folder className="h-3 w-3" />
                    {directory}
                  </Badge>
                )}
                {pendingFiles.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs sm:text-sm px-2 py-1"
                  >
                    Pending: {pendingFiles.length}
                  </Badge>
                )}
                {uploadingFiles.length > 0 && (
                  <Badge
                    variant="default"
                    className="text-xs sm:text-sm px-2 py-1"
                  >
                    Uploading: {uploadingFiles.length}
                  </Badge>
                )}
                {completedFiles.length > 0 && (
                  <Badge
                    variant="default"
                    className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm px-2 py-1"
                  >
                    Completed: {completedFiles.length}
                  </Badge>
                )}
                {errorFiles.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-xs sm:text-sm px-2 py-1"
                  >
                    Failed: {errorFiles.length}
                  </Badge>
                )}
              </div>
            )}

            {/* Upload Progress with Speed and Time - Responsive sizing */}
            {isUploading && uploadStats && (
              <div className="space-y-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-medium">Upload Progress</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 sm:h-3" />

                {/* Upload Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    <div>
                      <p className="text-gray-600">Speed</p>
                      <p className="font-mono font-medium">
                        {formatSpeed(uploadStats.speed)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    <div>
                      <p className="text-gray-600">ETA</p>
                      <p className="font-mono font-medium">
                        {uploadStats.estimatedTimeRemaining > 0
                          ? formatTime(uploadStats.estimatedTimeRemaining)
                          : "--"}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-gray-600">Uploaded</p>
                    <p className="font-mono font-medium text-xs sm:text-sm">
                      {formatFileSize(uploadStats.uploadedBytes)} /{" "}
                      {formatFileSize(uploadStats.totalBytes)}
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-gray-600">Elapsed</p>
                    <p className="font-mono font-medium">
                      {formatTime((Date.now() - uploadStats.startTime) / 1000)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Upload Stats */}
            {!isUploading && uploadStats && uploadStats.endTime && (
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  <h3 className="text-sm sm:text-base font-medium text-green-800">
                    Upload Completed
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-green-600">Total Time</p>
                    <p className="font-mono font-medium text-green-800">
                      {formatDuration(
                        uploadStats.endTime - uploadStats.startTime
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600">Average Speed</p>
                    <p className="font-mono font-medium text-green-800">
                      {formatSpeed(uploadStats.speed)}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-green-600">Total Size</p>
                    <p className="font-mono font-medium text-green-800">
                      {formatFileSize(uploadStats.totalBytes)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* File List - Responsive layout and sizing with show more/less */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-medium text-gray-700">
                    Selected Files
                  </h3>
                  <div className="flex items-center gap-2">
                    {files.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFiles}
                        disabled={isUploading}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200 px-2 py-1 h-auto bg-transparent"
                      >
                        Clear All
                      </Button>
                    )}
                    {files.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllFiles(!showAllFiles)}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 p-1 h-auto"
                      >
                        {showAllFiles
                          ? "Show less"
                          : `See more (${files.length - 5})`}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 lg:max-h-80 overflow-y-auto">
                  {(showAllFiles ? files : files.slice(0, 5)).map(
                    (fileItem) => (
                      <div
                        key={fileItem.id}
                        className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {fileItem.status === "completed" && (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            )}
                            {fileItem.status === "uploading" && (
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-spin" />
                            )}
                            {fileItem.status === "error" && (
                              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                            )}
                            {fileItem.status === "pending" && (
                              <FileImage className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {fileItem.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(fileItem.file.size)}
                            </p>
                          </div>
                          {fileItem.status === "uploading" && (
                            <div className="flex-shrink-0 w-12 sm:w-16">
                              <Progress
                                value={fileItem.progress}
                                className="h-1"
                              />
                            </div>
                          )}
                        </div>
                        {fileItem.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileItem.id)}
                            className="flex-shrink-0 ml-1 sm:ml-2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  )}
                </div>

                {!showAllFiles && files.length > 5 && (
                  <div className="text-center py-2">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Showing 5 of {files.length} files
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upload Button - Responsive sizing */}
            <Button
              onClick={handleUpload}
              disabled={
                files.length === 0 ||
                isUploading ||
                !isOnline ||
                !directory.trim() ||
                !!directoryError
              }
              className="w-full text-sm sm:text-base"
              size="default"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">
                    Uploading {uploadingFiles.length} file(s)...
                  </span>
                  <span className="sm:hidden">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    Upload {files.length} file(s)
                  </span>
                  <span className="sm:hidden">Upload ({files.length})</span>
                </>
              )}
            </Button>

            {/* Messages - Responsive text */}
            {message && (
              <Alert
                className={
                  message.type === "error"
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                }
              >
                <AlertDescription
                  className={`text-xs sm:text-sm ${
                    message.type === "error" ? "text-red-800" : "text-green-800"
                  }`}
                >
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Previously Uploaded Count - Responsive text */}
            {uploaded.length > 0 && (
              <div className="text-center text-xs sm:text-sm text-gray-500">
                Previously uploaded: {uploaded.length} file(s)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PWA Components */}
      <PWAInstallPrompt />
      <OfflineIndicator />
    </div>
  );
};

export default App;
