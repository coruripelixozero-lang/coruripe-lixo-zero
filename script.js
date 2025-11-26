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
                    let helpHTML = '';

                    if (error.code === 1) {
                        msg = '🔒 Permissão de localização negada';
                        helpHTML = `
                            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 0.5rem;">
                                <strong>Como ativar a localização:</strong>
                                <ol style="margin: 0.5rem 0 0 1.2rem; padding: 0;">
                                    <li>Toque no <strong>🔒 cadeado</strong> ao lado do endereço do site</li>
                                    <li>Procure por <strong>"Localização"</strong></li>
                                    <li>Mude para <strong>"Permitir"</strong></li>
                                    <li>Recarregue a página e tente novamente</li>
                                </ol>
                            </div>
                        `;
                    } else if (error.code === 2) {
                        msg = '📡 Sinal GPS indisponível';
                        helpHTML = `
                            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 0.5rem;">
                                <strong>Verifique:</strong>
                                <ul style="margin: 0.5rem 0 0 1.2rem; padding: 0;">
                                    <li>Você está ao ar livre ou perto de uma janela?</li>
                                    <li>O GPS do seu dispositivo está ativado?</li>
                                    <li>Aguarde alguns segundos e tente novamente</li>
                                </ul>
                            </div>
                        `;
                    } else if (error.code === 3) {
                        msg = '⏱️ Tempo esgotado ao buscar GPS';
                        helpHTML = `
                            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-top: 0.5rem;">
                                <p style="margin: 0;">O GPS demorou muito para responder. Tente novamente ou <strong>marque o local manualmente no mapa</strong>.</p>
                            </div>
                        `;
                    }

                    locationStatus.innerHTML = `<strong style="color: var(--error);">${msg}</strong>${helpHTML}`;

                    btnMyLocation.innerHTML = originalText;
                    btnMyLocation.disabled = false;
                }, options);
            } else {
                locationStatus.innerHTML = '<strong style="color: var(--error);">Seu navegador não suporta geolocalização.</strong>';
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
            e.preventDefault();

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    uploadOptions.style.display = 'none';
                    previewContainer.style.display = 'block';
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
                        captureBtn.className = 'btn-submit';
                        captureBtn.textContent = '📸 Capturar Foto';
                        captureBtn.style.marginBottom = '1rem';
                        previewContainer.insertBefore(captureBtn, removeImageBtn);

                        captureBtn.addEventListener('click', () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            canvas.getContext('2d').drawImage(video, 0, 0);

                            imagePreview.src = canvas.toDataURL('image/jpeg');
                            imagePreview.style.display = 'block';

                            stopCamera();

                            removeImageBtn.style.display = 'inline-block';
                            video.style.display = 'none';
                            captureBtn.style.display = 'none';

                            canvas.toBlob(blob => {
                                if (blob) {
                                    const file = new File([blob], "foto_denuncia_" + Date.now() + ".jpg", {
                                        type: "image/jpeg",
                                        lastModified: Date.now()
                                    });

                                    const container = new DataTransfer();
                                    container.items.add(file);

                                    cameraInput.files = container.files;
                                    galleryInput.files = container.files;

                                    console.log("Photo attached:", file.name, file.size, "bytes");
                                } else {
                                    console.error("Failed to convert photo to blob");
                                }
                            }, 'image/jpeg', 0.95);
                        });
                    }
                    captureBtn.style.display = 'block';

                    cameraStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "environment" }
                    });
                    video.srcObject = cameraStream;

                } catch (err) {
                    console.error("Camera failed:", err);
                    stopCamera();
                    uploadOptions.style.display = 'grid';
                    previewContainer.style.display = 'none';
                    cameraInput.click();
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

    // Handle File Select
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                previewContainer.style.display = 'block';
                if (uploadOptions) uploadOptions.style.display = 'none';

                removeImageBtn.style.display = 'inline-block';

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
            stopCamera();
        });
    }

    // Handle Form Submission
    const form = document.getElementById('reportForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
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
            const originalBtnText = submitBtn.innerHTML;

            // UI Feedback: Sending
            submitBtn.disabled = true;
            submitBtn.innerHTML = '📤 Enviando...';

            // Create hidden inputs for dynamic data (timestamp and mapLink)
            const addHiddenInput = (name, value) => {
                let input = form.querySelector(`input[name="${name}"]`);
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = name;
                    form.appendChild(input);
                }
                input.value = value;
            };

            addHiddenInput('timestamp', new Date().toLocaleString('pt-BR'));
            addHiddenInput('mapLink', `https://www.google.com/maps/search/?api=1&query=${latInput.value},${lngInput.value}`);

            // Ensure empty file inputs are disabled so they don't send empty attachments (optional, but good practice)
            // However, sendForm handles empty files gracefully usually.

            try {
                // Send email via EmailJS using sendForm (supports attachments)
                // Passing public key as 4th argument to ensure it's found
                const response = await emailjs.sendForm(
                    'service_4qehd6j',  // Service ID
                    'template_rfq2zo5', // Template ID
                    form,
                    'xochWN2TXVL6x0qjv' // Public Key
                );

                console.log('Email sent successfully:', response);

                // Show thank you message
                document.body.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; background: var(--bg);">
                        <div style="max-width: 500px;">
                            <h1 style="font-size: 3rem; margin-bottom: 1rem;">🎉</h1>
                            <h2 style="color: var(--primary); margin-bottom: 1rem;">Obrigado!</h2>
                            <p style="font-size: 1.2rem; color: var(--text); margin-bottom: 2rem;">
                                Sua denúncia foi enviada com sucesso. Agradecemos por ajudar a manter Coruripe limpa!
                            </p>
                            <a href="index.html" style="display: inline-block; padding: 1rem 2rem; background: var(--primary); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Fazer Nova Denúncia
                            </a>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Email sending failed:', error);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                alert('❌ Erro ao enviar denúncia. Por favor, tente novamente.\n\nDetalhes: ' + JSON.stringify(error));
            }
        });
    }

    // Theme Toggle Logic
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        const themeIcon = themeBtn.querySelector('.theme-icon');
        const body = document.body;

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '🌙';
        }

        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');

            themeIcon.textContent = isDark ? '🌙' : '☀️';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});
