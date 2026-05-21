document.addEventListener('DOMContentLoaded', () => {
    // Dinamik bölüm ekleme butonları
    document.getElementById('addEducation').addEventListener('click', () => {
        const container = document.getElementById('educationContainer');
        const entry = document.createElement('div');
        entry.className = 'education-entry';
        entry.innerHTML = `
            <div class="grid-2">
                <div class="form-group">
                    <label>Okul / Üniversite</label>
                    <input type="text" class="school" placeholder="Üniversite adı">
                </div>
                <div class="form-group">
                    <label>Bölüm</label>
                    <input type="text" class="department" placeholder="Bölüm">
                </div>
                <div class="form-group">
                    <label>Derece</label>
                    <select class="degree">
                        <option value="">Seçiniz</option>
                        <option value="Lise">Lise</option>
                        <option value="Ön Lisans">Ön Lisans</option>
                        <option value="Lisans">Lisans</option>
                        <option value="Yüksek Lisans">Yüksek Lisans</option>
                        <option value="Doktora">Doktora</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Mezuniyet Yılı</label>
                    <input type="text" class="graduationYear" placeholder="2022">
                </div>
            </div>
        `;
        container.appendChild(entry);
    });

    document.getElementById('addExperience').addEventListener('click', () => {
        const container = document.getElementById('experienceContainer');
        const entry = document.createElement('div');
        entry.className = 'experience-entry';
        entry.innerHTML = `
            <div class="grid-2">
                <div class="form-group">
                    <label>Şirket</label>
                    <input type="text" class="company" placeholder="Şirket adı">
                </div>
                <div class="form-group">
                    <label>Pozisyon</label>
                    <input type="text" class="position" placeholder="Pozisyon">
                </div>
                <div class="form-group">
                    <label>Başlangıç</label>
                    <input type="text" class="startDate" placeholder="Ocak 2020">
                </div>
                <div class="form-group">
                    <label>Bitiş</label>
                    <input type="text" class="endDate" placeholder="Devam ediyor">
                </div>
            </div>
            <div class="form-group">
                <label>Açıklama</label>
                <textarea class="description" rows="2" placeholder="Sorumluluklar..."></textarea>
            </div>
        `;
        container.appendChild(entry);
    });

    document.getElementById('addCertificate').addEventListener('click', () => {
        const container = document.getElementById('certificateContainer');
        const entry = document.createElement('div');
        entry.className = 'certificate-entry';
        entry.innerHTML = `
            <div class="grid-2">
                <div class="form-group">
                    <label>Sertifika Adı</label>
                    <input type="text" class="certName" placeholder="Sertifika">
                </div>
                <div class="form-group">
                    <label>Kurum</label>
                    <input type="text" class="certInstitution" placeholder="Kurum">
                </div>
                <div class="form-group">
                    <label>Yıl</label>
                    <input type="text" class="certYear" placeholder="2023">
                </div>
            </div>
        `;
        container.appendChild(entry);
    });

    // Ana form gönderimi
    document.getElementById('cvForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('generateBtn');
        const spinner = btn.querySelector('.spinner');
        const statusDiv = document.getElementById('statusMessage');

        // Butonu devre dışı bırak, spinner göster
        btn.disabled = true;
        spinner.style.display = 'inline-block';
        btn.childNodes[1] && (btn.childNodes[1].textContent = ' CV Oluşturuluyor...');

        // Verileri topla
        const formData = {
            personal: {
                fullName: document.getElementById('fullName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                address: document.getElementById('address').value.trim(),
            },
            education: [],
            experience: [],
            certificates: [],
            skills: document.getElementById('skills').value.trim(),
            summary: document.getElementById('summary').value.trim(),
            languages: document.getElementById('languages').value.trim(),
        };

        // Eğitimleri topla
        document.querySelectorAll('.education-entry').forEach(entry => {
            formData.education.push({
                school: entry.querySelector('.school')?.value || '',
                department: entry.querySelector('.department')?.value || '',
                degree: entry.querySelector('.degree')?.value || '',
                graduationYear: entry.querySelector('.graduationYear')?.value || '',
            });
        });

        // Deneyimleri topla
        document.querySelectorAll('.experience-entry').forEach(entry => {
            formData.experience.push({
                company: entry.querySelector('.company')?.value || '',
                position: entry.querySelector('.position')?.value || '',
                startDate: entry.querySelector('.startDate')?.value || '',
                endDate: entry.querySelector('.endDate')?.value || '',
                description: entry.querySelector('.description')?.value || '',
            });
        });

        // Sertifikaları topla
        document.querySelectorAll('.certificate-entry').forEach(entry => {
            formData.certificates.push({
                name: entry.querySelector('.certName')?.value || '',
                institution: entry.querySelector('.certInstitution')?.value || '',
                year: entry.querySelector('.certYear')?.value || '',
            });
        });

        // Fotoğrafı base64 olarak al
        const photoInput = document.getElementById('photo');
        let photoBase64 = null;
        if (photoInput.files && photoInput.files[0]) {
            photoBase64 = await fileToBase64(photoInput.files[0]);
        }

        try {
            statusDiv.style.display = 'block';
            statusDiv.className = 'status-message loading';
            statusDiv.textContent = 'Yapay zeka CV içeriğini hazırlıyor...';

            // Cloudflare Function'a istek at
            const response = await fetch('/api/generate-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('API hatası: ' + response.statusText);

            const data = await response.json();
            if (!data.cvContent) throw new Error('CV içeriği alınamadı.');

            statusDiv.textContent = 'PDF oluşturuluyor...';

            // PDF oluştur
            await generatePDF(data.cvContent, formData.personal, photoBase64);

            statusDiv.className = 'status-message success';
            statusDiv.textContent = '✅ CV başarıyla oluşturuldu ve indiriliyor!';
        } catch (error) {
            console.error(error);
            statusDiv.className = 'status-message error';
            statusDiv.textContent = '❌ Hata: ' + error.message + ' (API anahtarını kontrol et, Cloudflare Functions ayarlarını gözden geçir.)';
        } finally {
            btn.disabled = false;
            spinner.style.display = 'none';
            btn.childNodes[1] && (btn.childNodes[1].textContent = '✨ Yapay Zeka CV\'ni Oluştur ve PDF İndir');
        }
    });

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    }

    async function generatePDF(cvContent, personalInfo, photoBase64) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Renk ve font ayarları
        const primaryColor = [79, 70, 229]; // Indigo
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 15;

        // Arka plan başlık bandı
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 35, 'F');

        // İsim
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(personalInfo.fullName || 'Ad Soyad', 15, 18);

        // İletişim bilgileri (başlığın altında)
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let contactY = 42;
        if (personalInfo.email) {
            doc.text(`📧 ${personalInfo.email}`, 15, contactY);
            contactY += 6;
        }
        if (personalInfo.phone) {
            doc.text(`📞 ${personalInfo.phone}`, 15, contactY);
            contactY += 6;
        }
        if (personalInfo.address) {
            doc.text(`📍 ${personalInfo.address}`, 15, contactY);
            contactY += 6;
        }

        // Fotoğraf ekle (varsa)
        if (photoBase64) {
            try {
                doc.addImage(photoBase64, 'JPEG', pageWidth - 35, 10, 25, 30, undefined, 'FAST');
            } catch (e) {
                console.warn('Fotoğraf eklenemedi', e);
            }
        }

        // Yapay zeka tarafından oluşturulan CV metnini ekle
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);

        // Metni paragraflara böl ve sayfaya sığdır
        const lines = doc.splitTextToSize(cvContent, pageWidth - 30);
        yPos = contactY + 8;

        // Sayfa kontrolü yaparak yazdır
        for (let i = 0; i < lines.length; i++) {
            if (yPos > 275) {
                doc.addPage();
                yPos = 15;
            }
            // Başlık satırlarını kalın yap (basit tespit)
            if (lines[i].startsWith('**') || lines[i].endsWith(':**') || lines[i].match(/^[A-ZÇŞİĞÜÖ\s]+$/)) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(...primaryColor);
            } else {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(30, 41, 59);
            }
            doc.text(lines[i], 15, yPos);
            yPos += 6;
        }

        doc.save(`${personalInfo.fullName || 'CV'}_AI_CV.pdf`);
    }
});