# File Upload & Bulk Import Feature Audit

**Date:** April 16, 2026  
**Status:** Complete codebase analysis

---

## Executive Summary

**The codebase DOES NOT have CSV/Excel bulk import functionality** despite the testing document mentioning "Bulk stock import via CSV working". The application has:
- ✅ Individual image uploads for products, banners, and categories
- ✅ Return form image uploads
- ✅ Inventory export functionality (Excel & PDF)
- ❌ NO bulk stock import from CSV/Excel files
- ❌ NO bulk product import
- ❌ NO inventory import endpoints

---

## File Upload Features (Actually Implemented)

### 1. **Product Image Uploads**
- **Frontend:** `admin/src/pages/ProductForm.jsx` (Line 586)
- **File Input:** `<input type="file" accept="image/*" multiple>`
- **Backend Endpoint:** `POST /api/products` (admin only)
- **Handler:** `upload.any()` middleware
- **Details:**
  - Multiple images per product
  - Supports variant-specific images
  - Stores paths in database
  - Max file size: 10MB
  - Storage: Local disk in `/uploads` directory

### 2. **Banner Image Uploads**
- **Frontend:** `admin/src/pages/Banners.jsx` (Lines 223, 245, 328, 367)
- **File Inputs:** Multiple - for banner fallback, product fallback, category banners, subcategory banners
- **Backend Endpoints:**
  - `POST /api/banners` - Create new banner with image
  - `PUT /api/banners/:id` - Update banner with new image
- **Handler:** `upload.single('image')` middleware
- **Details:**
  - Single image per operation
  - Image cropping functionality (21:9 ratio for banners, 3:4 for products)
  - Max file size: 10MB

### 3. **Category/Subcategory Banner Uploads**
- **Frontend:** `admin/src/pages/Banners.jsx`
- **Backend:** `PUT /api/categories/:id`
- **Handler:** `upload.any()` middleware
- **Details:**
  - Supports banner images for main categories
  - Supports banner images for subcategories

### 4. **Settings/Fallback Images**
- **Frontend:** `admin/src/pages/Banners.jsx`
- **Backend Endpoint:** `PUT /api/settings`
- **Handler:** `upload.any()` middleware
- **Details:**
  - Banner fallback image
  - Product fallback image
  - Max file size: 10MB

### 5. **Return Request Images**
- **Frontend:** N/A (Public API)
- **Backend Endpoints:**
  - `POST /api/orders/guest-return` - Guest returns
  - `POST /api/orders/:id/return` - Authenticated returns
- **Handler:** `upload.array('images', 5)` middleware
- **Details:**
  - Up to 5 images per return request
  - Max file size: 10MB total

---

## Export Features (For Data Download)

### **Inventory Export** (`admin/src/pages/Inventory.jsx`)
- **Excel Export:** `exportToExcel()` function
  - Uses `XLSX` library
  - Creates two sheets: "Available Stock" and "Stock Logs"
  - Exports product names, categories, colors, sizes, current stock, sold quantity
  - Date range filtering supported
  - Filename: `Inventory_Report_[dateRange].xlsx`

- **PDF Export:** `exportToPDF()` function
  - Uses `jsPDF` and `jspdf-autotable` libraries
  - Creates tables with product and log data
  - Filename: `Inventory_Report_[dateRange].pdf`

---

## Bulk Operations (NOT File-Based)

### **Bulk Order Status Update** (`admin/src/pages/Orders.jsx`)
- **Not file-based** - Updates existing orders in bulk via UI
- State: `pendingBulkUpdate` (Line 49)
- UI allows selecting multiple orders and changing their status
- No CSV import involved

### **Bulk Stock Adjustment** (Testing Document References)
- **Not implemented via file upload**
- Only manual per-product adjustment via Inventory page
- Backend: `PUT /api/inventory/adjust/:id`
- Handles single product/variant stock changes

---

## Backend Upload Infrastructure

### **Multer Middleware** (`backend/middleware/upload.js`)
```javascript
- Storage: Disk storage to `/uploads` directory
- Filename: Unique timestamp + random number + original extension
- Max file size: 10MB per file
- No file type restrictions at middleware level
```

### **File Upload Endpoints Summary**

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/products` | POST | Admin | `upload.any()` | Create product with images |
| `/api/products/:id` | PUT | Admin | `upload.any()` | Update product with images |
| `/api/banners` | POST | Admin | `upload.single()` | Create banner |
| `/api/banners/:id` | PUT | Admin | `upload.single()` | Update banner |
| `/api/categories` | POST | Admin | `upload.any()` | Create category |
| `/api/categories/:id` | PUT | Admin | `upload.any()` | Update category |
| `/api/settings` | PUT | Admin | `upload.any()` | Update settings & fallbacks |
| `/api/orders/guest-return` | POST | None | `upload.array(5)` | Guest return images |
| `/api/orders/:id/return` | POST | User | `upload.array(5)` | User return images |

---

## What's MISSING

### **No Bulk Inventory Import**
- ❌ No CSV file parsing
- ❌ No Excel/XLSX parsing for stock updates
- ❌ No endpoint like `POST /api/inventory/import`
- ❌ No bulk product stock update from files
- ❌ No batch stock adjustment via file upload

### **No Bulk Product Import**
- ❌ No CSV product creation
- ❌ No batch product creation from file
- ❌ No product data migration from files

### **Frontend Upload UI Missing**
- ❌ No file input element in Inventory page for importing
- ❌ No "Import CSV" button
- ❌ No file drag-drop zone for inventory updates

---

## Libraries Used for File Operations

### **Frontend Libraries**
- `xlsx` (v0.18+) - Excel file creation/export
- `jspdf` - PDF generation
- `jspdf-autotable` - PDF table formatting
- React's native File API

### **Backend Libraries**
- `multer` (v1.4.5-lts.1) - File upload middleware
- `multer-storage-cloudinary` (v4.0.0) - Cloudinary integration (not actively used for file storage)

---

## Security Considerations

### **Current Implementation**
- ✅ Admin middleware protection on product/banner uploads
- ✅ 10MB file size limit enforced
- ✅ Disk storage with unique filenames
- ✅ No arbitrary file type restrictions at middleware (relying on FormData validation)

### **Missing Safeguards (if bulk import added)**
- No file type validation (CSV, XLSX, etc.)
- No CSV injection protection
- No data validation schema for imported data
- No rollback mechanism for failed bulk operations
- No logging of bulk import operations

---

## Recommendations

### **To Implement Bulk Stock Import:**
1. Add CSV/Excel parsing library (`papaparse` for CSV, `xlsx` for Excel)
2. Create new endpoint: `POST /api/inventory/import`
3. Validate data structure and required fields
4. Implement transaction support for atomic updates
5. Add frontend UI component in Inventory page with file input
6. Create detailed error logging for import failures
7. Add preview functionality before importing
8. Implement rollback on validation failures

### **Example Data Format for Import:**
```csv
Product Name,Color,Size,Quantity,Reason
Kurti A,Red,S,100,Stock Update
Kurti A,Red,M,50,Stock Update
Kurti B,Blue,L,75,Restock
```

---

## Files Analyzed

### Frontend
- `admin/src/pages/Inventory.jsx` - Export only, no import
- `admin/src/pages/ProductForm.jsx` - Individual product image uploads
- `admin/src/pages/Products.jsx` - Product listing, no bulk import
- `admin/src/pages/Banners.jsx` - Banner/image management
- `admin/src/pages/Orders.jsx` - Bulk status updates (not file-based)
- `admin/src/api.js` - API configuration

### Backend
- `backend/routes/inventory.js` - Stock management (adjust only, no import)
- `backend/routes/products.js` - Product CRUD with image uploads
- `backend/routes/banners.js` - Banner management
- `backend/routes/categories.js` - Category management
- `backend/routes/settings.js` - Settings management
- `backend/routes/orders.js` - Order management with return images
- `backend/middleware/upload.js` - Multer configuration

---

**Conclusion:** The application has a solid image upload infrastructure but lacks any bulk data import functionality. The testing document's mention of "Bulk stock import via CSV" may be aspirational requirements rather than implemented features.
