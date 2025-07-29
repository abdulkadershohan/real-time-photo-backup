# Real-Time Photo Backup System

A modern, full-stack photo backup application that allows users to upload multiple images with real-time progress tracking, browse photos in an elegant gallery, and download them individually or in batches. Built with Next.js and Express.js.


### 🎥 Tutorial : [Click here](https://youtu.be/JsM2Vgog2sM?si=B3XBf3rSqS5yszpc)

## 🌟 Features

### 📤 Upload Features

- **Drag & Drop Support**: Intuitive file dropping interface
- **Multi-file Upload**: Upload multiple photos simultaneously
- **Real-time Progress**: Individual file upload progress tracking
- **Directory Organization**: Organize photos into custom directories
- **Offline Support**: PWA functionality with offline capabilities
- **Mobile Responsive**: Works seamlessly on mobile devices
- **File Validation**: Automatic image format validation
- **Resume Upload**: Continue interrupted uploads

### 🖼️ Gallery Features

- **Photo Browser**: Browse photos by directory
- **Grid & List View**: Toggle between different viewing modes
- **Search Functionality**: Search photos by filename
- **Batch Selection**: Select multiple photos for operations
- **Bulk Download**: Download multiple photos at once
- **Full-Screen Preview**: Modal view for detailed photo inspection
- **Selection Mode**: Advanced photo selection with visual feedback
- **Responsive Design**: Optimized for all screen sizes

### 🔧 Technical Features

- **Progressive Web App (PWA)**: Installable on desktop and mobile
- **Service Worker**: Offline functionality and caching
- **Real-time Updates**: Live upload progress and status
- **Error Handling**: Comprehensive error management
- **CORS Support**: Cross-origin resource sharing
- **File Streaming**: Efficient file handling
- **Memory Management**: Optimized for large file uploads

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.2.4 (React 18+)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI Primitives
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Language**: TypeScript

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **File Upload**: Multer 2.0.2
- **CORS**: CORS middleware
- **Environment**: Dotenv

### Additional Tools

- **Package Manager**: PNPM (Frontend), NPM (Backend)
- **File System**: Node.js FS module
- **Path Handling**: Node.js Path module

## 📁 Project Structure

```
real-time-photo-backup/
├── backend/                    # Express.js backend server
│   ├── index.js               # Main server file
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
│
├── multi-file-uploader/       # Next.js frontend application
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx          # Upload page
│   │   └── photos/
│   │       └── page.tsx      # Photo gallery page
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── Footer.tsx        # Footer component
│   │   ├── offline-indicator.tsx
│   │   └── pwa-install-prompt.tsx
│   │
│   ├── config/               # Configuration files
│   │   └── index.ts         # API base URL
│   │
│   ├── public/              # Static assets
│   │   ├── manifest.json    # PWA manifest
│   │   └── sw.js           # Service worker
│   │
│   └── package.json        # Frontend dependencies
│
├── start-both-app.bat      # Windows batch script to start both servers
├── start.vbs              # Silent startup script
└── README.md             # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- NPM or PNPM
- Windows OS (for batch scripts)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/abdulkadershohan/real-time-photo-backup.git
cd real-time-photo-backup
```

2. **Install backend dependencies**

```bash
cd backend
npm install
```

3. **Install frontend dependencies**

```bash
cd ../multi-file-uploader
npm install
# or
pnpm install
```

4. **Configure environment variables**
   Create a `.env` file in the `backend` directory:

```env
PORT=4001
BASE_UPLOAD_DIR=your path Example: D:/Shohan/backup_images
```

5. **Update API configuration**
   Edit `multi-file-uploader/config/index.ts`:

```typescript
export const BASE_URL = "http://your-ip-address:4001";
```

### Running the Application

#### Option 1: Using Batch Script (Windows)

```bash
# Run both frontend and backend simultaneously
./start-both-app.bat
```

#### Option 2: Manual Start

```bash
# Terminal 1 - Start backend
cd backend
node index.js

# Terminal 2 - Start frontend
cd multi-file-uploader
npm start
# or
pnpm start
```

### Accessing the Application

- **Frontend**: http://localhost:4000
- **Backend API**: http://localhost:4001
- **Photo Gallery**: http://localhost:4000/photos

### 🔄 Auto-Start on Windows Boot (Optional)

To automatically start both applications when Windows starts up:

1. **Create a shortcut of the VBS file**:

   - Right-click on `start.vbs` in your project folder
   - Select "Create shortcut"

2. **Open Windows Startup folder**:

   - Press `Win + R` to open Run dialog
   - Type `shell:startup` and press Enter
   - This opens the Windows Startup folder

3. **Move the shortcut**:

   - Cut or copy the `start.vbs` shortcut you created
   - Paste it into the Startup folder that opened

4. **Restart your computer**:
   - Both applications will now start automatically when Windows boots
   - The VBS script runs silently in the background (no visible console windows)

> **Note**: The `start.vbs` file runs the batch script silently without showing command prompt windows, providing a clean startup experience.

## 📖 Usage Guide

### Uploading Photos

1. **Set Directory**: Enter a directory path (e.g., `photos/2024/january`)
2. **Select Files**: Click "Choose Files" or drag & drop images
3. **Monitor Progress**: Watch real-time upload progress for each file
4. **Complete Upload**: Files are automatically organized in the specified directory

### Browsing Photos

1. **Navigate to Gallery**: Click "View Photos" or visit `/photos`
2. **Enter Directory**: Specify the directory path to browse
3. **Search Photos**: Use the search bar to find specific files
4. **Switch Views**: Toggle between grid and list view modes

### Downloading Photos

1. **Single Download**: Click the download icon on any photo
2. **Batch Download**:
   - Enable "Select Photos" mode
   - Choose multiple photos
   - Click "Download Selected"

## 🔧 API Endpoints

### Backend REST API

| Method | Endpoint                     | Description                                   |
| ------ | ---------------------------- | --------------------------------------------- |
| `POST` | `/upload`                    | Upload multiple photos to specified directory |
| `GET`  | `/photos?dir={path}`         | Get list of photos in directory               |
| `GET`  | `/files/{dir}/{filename}`    | Serve photo file with CORS headers            |
| `GET`  | `/download/{dir}/{filename}` | Download photo with attachment headers        |

### API Usage Examples

**Upload Photos**

```javascript
const formData = new FormData();
formData.append("dir", "photos/2024");
formData.append("photos", file1);
formData.append("photos", file2);

fetch("/upload", {
  method: "POST",
  body: formData,
});
```

**Get Photos List**

```javascript
fetch("/photos?dir=photos/2024")
  .then((response) => response.json())
  .then((data) => console.log(data.files));
```

## 🎨 Features in Detail

### Progressive Web App (PWA)

- Installable on desktop and mobile devices
- Offline functionality with service worker
- App-like experience with custom manifest
- Background sync for failed uploads

### Responsive Design

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly controls
- Optimized image loading

### File Management

- Automatic directory creation
- Support for multiple image formats (JPG, PNG, GIF, WebP, BMP)
- File size validation
- Error handling for corrupted files

## 🛡️ Security Considerations

- CORS properly configured for cross-origin requests
- File type validation on both client and server
- Path traversal protection
- Memory-efficient file handling
- Error sanitization

## 🚧 Development

### Adding New Features

1. **Backend**: Add new endpoints in `backend/index.js`
2. **Frontend**: Create components in `multi-file-uploader/components/`
3. **UI**: Use existing Shadcn/ui components or add new ones
4. **Styling**: Extend Tailwind classes in component files

### Environment Setup for Development

```bash
# Backend development with auto-restart
cd backend
npx nodemon index.js

# Frontend development with hot reload
cd multi-file-uploader
npm run dev
```

## 📦 Deployment

### Production Build

```bash
# Build frontend
cd multi-file-uploader
npm run build

# Start production servers
npm run start  # Frontend on port 4000
cd ../backend && node index.js  # Backend on port 4001
```

### Environment Variables

**Backend (.env)**

```env
PORT=4001
BASE_UPLOAD_DIR=/path/to/upload/directory
NODE_ENV=production
```

**Frontend (config/index.ts)**

```typescript
export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-api-domain.com"
    : "http://localhost:4001";
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Abdul Kader Shohan**

- GitHub: [@abdulkadershohan](https://github.com/abdulkadershohan)
- Project: [Real-Time Photo Backup](https://github.com/abdulkadershohan/real-time-photo-backup)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for the icon set
- [Radix UI](https://www.radix-ui.com/) for accessible primitives

---

## 📋 Changelog

### Version 1.0.0 (Current)

- ✅ Multi-file upload with progress tracking
- ✅ Photo gallery with grid/list views
- ✅ Batch photo selection and download
- ✅ PWA support with offline functionality
- ✅ Responsive design for all devices
- ✅ Search and filter capabilities
- ✅ Real-time upload status updates

### Planned Features

- 🔄 Photo editing capabilities
- 🔄 Cloud storage integration
- 🔄 User authentication
- 🔄 Photo tagging and metadata
- 🔄 Automatic photo organization
- 🔄 Photo sharing functionality

---

_Built with ❤️ for seamless photo backup and management_
