# Deploy Backend to Render

## Prerequisites
- Render account
- GitHub repository connected to Render

## Deployment Steps

### 1. Configure Render Service

In Render Dashboard:

1. **Create New Web Service**
   - Connect your GitHub repository
   - Select branch: `main` or `develop`

2. **Build & Deploy Settings**
   ```
   Name: i-amp-yoqa-backend
   Environment: Node
   Region: Singapore (or your preferred region)
   Branch: main
   Root Directory: back-end
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables**
   Add all required environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FIREBASE_CONFIG`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - etc.

### 2. Install LibreOffice (for PDF conversion)

**Option A: Using Aptfile (Recommended)**

The `Aptfile` in the back-end directory will automatically install:
- `libreoffice`
- `libreoffice-writer`
- `fonts-thai-tlwg` (Thai fonts)

Render will automatically detect and use this file.

**Option B: Using Native Environment**

Use the `render.yaml` configuration file which specifies:
```yaml
nativeEnvironment:
  - key: APT_PACKAGES
    value: libreoffice libreoffice-writer fonts-thai-tlwg
```

### 3. Verify Template Files

Ensure template files are committed to git:
```bash
git ls-files | grep template
# Should show: back-end/templates/receipt-template.docx
```

### 4. Test PDF Generation

After deployment, test the PDF generation endpoint:
```
GET /api/receipts/{receiptId}/pdf
```

## Troubleshooting

### LibreOffice not installed
- Check Render logs for apt installation
- Verify Aptfile exists in root directory
- Try using render.yaml configuration

### Template file not found
- Ensure template is committed to git
- Check file path in receiptController.js
- Verify file exists after deployment: `/opt/render/project/src/back-end/templates/receipt-template.docx`

### Thai fonts not displaying
- Ensure `fonts-thai-tlwg` is installed via Aptfile
- Check LibreOffice font configuration

### Memory issues
- Upgrade Render plan if needed
- LibreOffice requires sufficient memory for PDF conversion

## Important Notes

1. **Free Tier Limitations**: Render free tier spins down after inactivity. First request may be slow.

2. **File System**: Render uses ephemeral file system. Temporary files in `/tmp` are deleted after deployment.

3. **Build Time**: Installing LibreOffice increases build time by 2-3 minutes.

4. **Template Updates**: Any template changes require redeployment.

## Alternative: Use PDF Generation Service

If LibreOffice installation fails, consider using external PDF services:
- Docmosis Cloud
- PDFMonkey
- Carbone.io
