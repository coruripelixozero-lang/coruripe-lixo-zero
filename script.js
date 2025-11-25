document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map centered on Coruripe, Alagoas
    // Coordinates: -10.1256, -36.1756 (Approximate center of Coruripe)
    const map = L.map('map').setView([-10.1256, -36.1756], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let currentMarker = null;
    let accuracyCircle = null;
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    const locationStatus = document.getElementById('locationStatus');

    // Handle Map Click
    map.on('click', (e) => {
        updateMarker(e.latlng.lat, e.latlng.lng);
        // Remove accuracy circle if user manually clicks
        if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
            accuracyCircle = null;
        }
    });

    function updateMarker(lat, lng) {
        // Remove existing marker if any
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        // Add new marker
        currentMarker = L.marker([lat, lng]).addTo(map);

        // Update hidden inputs
        latInput.value = lat;
        lngInput.value = lng;

        // Update status text
        locationStatus.textContent = `Local selecionado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        locationStatus.style.color = 'var(--primary-dark)';

        // Animation effect
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
    }

    // Handle "My Location" Button with High Accuracy
    const btnMyLocation = document.getElementById('btnMyLocation');
    if (btnMyLocation) {
        btnMyLocation.addEventListener('click', () => {
            if ("geolocation" in navigator) {
                const originalText = btnMyLocation.innerHTML;
                btnMyLocation.innerHTML = '<i>⌛</i> Buscando GPS...';
                btnMyLocation.disabled = true;

                const options = {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                };

                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude, accuracy } = position.coords;

                    // Update marker
                    updateMarker(latitude, longitude);

                    // Show accuracy circle
                    if (accuracyCircle) map.removeLayer(accuracyCircle);
                    accuracyCircle = L.circle([latitude, longitude], { radius: accuracy }).addTo(map);

                    // Zoom to location
                    map.setView([latitude, longitude], 18);

                    btnMyLocation.innerHTML = '<i>📍</i> Minha Localização Atual';
                    btnMyLocation.disabled = false;
                    locationStatus.innerHTML = `Local encontrado! <br><small>(Precisão: ${Math.round(accuracy)} metros)</small>`;
                    locationStatus.style.color = 'var(--success)';
                }, (error) => {
                    console.error("Error getting location:", error);
                    let msg = 'Erro ao obter localização.';
                    if (error.code === 1) msg = 'Permissão negada. Ative o GPS.';
                    else if (error.code === 2) msg = 'Sinal GPS indisponível.';
                    else if (error.code === 3) msg = 'Tempo esgotado. Tente novamente.';

                    locationStatus.textContent = msg;
                    locationStatus.style.color = 'var(--error)';
                    alert(msg);

                    btnMyLocation.innerHTML = originalText;
                    btnMyLocation.disabled = false;
                }, options);
            } else {
                alert('Seu navegador não suporta geolocalização.');
            }
        });
    }

    // Camera & File Upload Logic
    const cameraInput = document.getElementById('trashPhotoCamera');
    const galleryInput = document.getElementById('trashPhotoGallery');
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('previewContainer');
    const removeImageBtn = document.getElementById('removeImage');
    const uploadOptions = document.querySelector('.upload-options');
    const btnCamera = document.getElementById('btnCamera');

    let cameraStream = null;

    // Handle "Usar Câmera" click (Inline Camera)
    if (btnCamera) {
        btnCamera.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent default behavior

            // Check if we can use getUserMedia
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    // 1. Hide upload options
                    uploadOptions.style.display = 'none';
                    previewContainer.style.display = 'block';

                    // 2. Setup Video Element dynamically (preserving layout)
                    // We reuse the preview container but swap content temporarily
                    imagePreview.style.display = 'none';
                    removeImageBtn.style.display = 'none';

                    let video = document.getElementById('cameraVideo');
                    if (!video) {
                        video = document.createElement('video');
                        video.id = 'cameraVideo';
                        video.autoplay = true;
                        video.playsInline = true;
                        video.style.width = '100%';
                        video.style.borderRadius = '12px';
                        video.style.marginBottom = '1rem';
                        previewContainer.insertBefore(video, removeImageBtn);
                    }
                    video.style.display = 'block';

                    let captureBtn = document.getElementById('btnCapture');
                    if (!captureBtn) {
                        captureBtn = document.createElement('button');
                        captureBtn.id = 'btnCapture';
                        captureBtn.type = 'button';
                        captureBtn.className = 'btn-submit'; // Reuse submit style for consistency
                        captureBtn.textContent = '📸 Capturar Foto';
                        captureBtn.style.marginBottom = '1rem';
                        previewContainer.insertBefore(captureBtn, removeImageBtn);

                        captureBtn.addEventListener('click', () => {
                            // Capture logic
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            canvas.getContext('2d').drawImage(video, 0, 0);

                            // Set to preview image
                            imagePreview.src = canvas.toDataURL('image/jpeg');
                            imagePreview.style.display = 'block';

                            // Cleanup camera UI
                            stopCamera();

                            // Show "Remove" button, hide capture button and video
                            removeImageBtn.style.display = 'inline-block';
                            video.style.display = 'none';
                            captureBtn.style.display = 'none';

                            // Put data into file input (optional, but good for form submission if needed, 
                            // though we might need to handle dataURL submission separately or just use the preview)
                            // For FormSubmit, we need a file. We can convert dataURL to Blob.
                            canvas.toBlob(blob => {
                                const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                                const container = new DataTransfer();
                                container.items.add(file);
                                cameraInput.files = container.files;
                            }, 'image/jpeg');
                        });
                    }
                    captureBtn.style.display = 'block';

                    // 3. Start Stream
                    cameraStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "environment" }
                    });
                    video.srcObject = cameraStream;

                } catch (err) {
                    console.error("Camera failed:", err);
                    alert("Não foi possível acessar a câmera. Usando galeria.");
                    stopCamera();
                    uploadOptions.style.display = 'grid'; // Restore options
                    previewContainer.style.display = 'none';
                    cameraInput.click(); // Fallback
                }
            } else {
                console.log("getUserMedia not supported. Using fallback.");
                cameraInput.click();
            }
        });
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    // Handle File Select (Gallery or Fallback Camera)
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                previewContainer.style.display = 'block';
                if (uploadOptions) uploadOptions.style.display = 'none';

                // Ensure remove button is visible
                removeImageBtn.style.display = 'inline-block';

                // Ensure camera elements are hidden if they exist
                const video = document.getElementById('cameraVideo');
                const captureBtn = document.getElementById('btnCapture');
                if (video) video.style.display = 'none';
                if (captureBtn) captureBtn.style.display = 'none';
            }
            reader.readAsDataURL(file);
        }
    }

    if (cameraInput) cameraInput.addEventListener('change', handleFileSelect);
    if (galleryInput) galleryInput.addEventListener('change', handleFileSelect);

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            if (cameraInput) cameraInput.value = '';
            if (galleryInput) galleryInput.value = '';
            previewContainer.style.display = 'none';
            if (uploadOptions) uploadOptions.style.display = 'grid';
            imagePreview.src = '';
            stopCamera(); // Ensure camera is stopped
        });
    }

    // Handle Form Submission
    const form = document.getElementById('reportForm');

    // Create status message element
    const statusMsg = document.createElement('div');
    statusMsg.style.marginTop = '1rem';
    statusMsg.style.textAlign = 'center';
    statusMsg.style.fontWeight = 'bold';
    statusMsg.style.display = 'none';
    if (form) form.appendChild(statusMsg);

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Basic validation
            const hasLocation = latInput.value && lngInput.value;
            const hasAddress = document.getElementById('addressStreet').value.trim() !== '';

            if (!hasLocation && !hasAddress) {
                alert('⚠️ Por favor, marque a localização no mapa OU informe o endereço.');
                document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
                return;
            }

            const submitBtn = form.querySelector('.btn-submit');

            // UI Feedback: Sending
            submitBtn.disabled = true;
            submitBtn.innerHTML = '🚀 Redirecionando...';
            statusMsg.style.display = 'block';
            statusMsg.style.color = 'var(--primary)';
            statusMsg.textContent = 'Você será redirecionado para confirmar o envio.';

            // Populate hidden inputs for location
            // Note: Standard form submission will automatically include all inputs with 'name' attributes.
            // We just need to ensure the custom location data is in inputs if not already.
            // The inputs 'latitude' and 'longitude' already exist and are updated by updateMarker.

            // We need to add the Map Link dynamically as a hidden input before submission
            let mapLinkInput = document.getElementById('mapLink');
            if (!mapLinkInput) {
                mapLinkInput = document.createElement('input');
                mapLinkInput.type = 'hidden';
                mapLinkInput.name = 'Mapa Link';
                mapLinkInput.id = 'mapLink';
                form.appendChild(mapLinkInput);
            }
            mapLinkInput.value = `https://www.google.com/maps/search/?api=1&query=${latInput.value},${lngInput.value}`;

            // Update email subject with timestamp to ensure uniqueness
            const subjectInput = document.getElementById('emailSubject');
            if (subjectInput) {
                const ts = new Date().toLocaleString('pt-BR');
                subjectInput.value = `Nova Denúncia - CoruripeLixoZero - ${ts}`;
            }

            // Allow the form to submit naturally
            form.submit();
        });
    }

    // Theme Toggle Logic
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        const themeIcon = themeBtn.querySelector('.theme-icon');
        const body = document.body;

        // Check for saved user preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '🌙';
        }

        themeBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default button behavior
            body.classList.toggle('dark-mode');
            body.classList.contains('dark-mode');
            const isDark = body.classList.contains('dark-mode');

            // Update icon
            themeIcon.textContent = isDark ? '🌙' : '☀️';

            // Save preference
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});
