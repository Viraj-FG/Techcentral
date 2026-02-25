// upload.js — Drag-and-drop + file input handling for Kaeva

(function () {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('mediaInput');
  const preview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const removeBtn = document.getElementById('removeFile');

  if (!dropzone || !fileInput) return;

  // Click to browse
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag events
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      showPreview(e.dataTransfer.files[0]);
    }
  });

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      showPreview(fileInput.files[0]);
    }
  });

  // Remove file
  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    preview.hidden = true;
    dropzone.style.display = '';
  });

  function showPreview(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatSize(file.size);
    preview.hidden = false;
    dropzone.style.display = 'none';
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
})();
