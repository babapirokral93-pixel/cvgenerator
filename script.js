// DİKKAT: BURAYA YEPYENİ BİR API ANAHTARI KOYMALISIN! 
// Eski anahtarın Google tarafından güvenlik nedeniyle engellenmiş olabilir.
const API_KEY = 'AIzaSyB-8sASTeAsAeak3BMC_dOXa9I2VBDbhfA'; 

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DİNAMİK ALAN EKLEME İŞLEMLERİ ---
    
    document.getElementById('deneyimEkle').addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'deneyim-grup';
        div.innerHTML = `
            <input type="text" class="sirket" placeholder="Şirket">
            <input type="text" class="pozisyon" placeholder="Pozisyon">
            <input type="text" class="tarih" placeholder="Tarih">
            <textarea class="aciklama" placeholder="Kısa açıklama"></textarea>
            <hr>
        `;
        document.getElementById('deneyimler').appendChild(div);
    });

    document.getElementById('yetenekEkle').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'yetenek';
        input.placeholder = 'Yetenek';
        document.getElementById('yetenekler').appendChild(input);
    });

    document.getElementById('sertifikaEkle').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sertifika';
        input.placeholder = 'Sertifika adı';
        document.getElementById('sertifikalar').appendChild(input);
    });

    // --- 2. FORM GÖNDERİMİ VE API İŞLEMLERİ ---
    
    document.getElementById('cvForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Buton durumunu ayarla
        const btn = document.getElementById('generateBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        
        btn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        try {
            // Verileri Topla
            const veri = {
                ad: document.getElementById('ad').value.trim(),
                soyad: document.getElementById('soyad').value.trim(),
                email: document.getElementById('email').value.trim(),
                telefon: document.getElementById('telefon').value.trim(),
                adres: document.getElementById('adres').value.trim(),
                tc: document.getElementById('tc').value.trim(),
                okul: document.getElementById('okul').value.trim(),
                bolum: document.getElementById('bolum').value.trim(),
                mezuniyetYili: document.getElementById('mezuniyetYili').value.trim(),
                ekAciklama: document.getElementById('ekAciklama').value.trim(),
                deneyimler: [],
                yetenekler: [],
                sertifikalar: []
            };

            document.querySelectorAll('.deneyim-grup').forEach(grup => {
                const sirket = grup.querySelector('.sirket')?.value.trim();
                if (sirket) {
                    veri.deneyimler.push({
                        sirket: sirket,
                        pozisyon: grup.querySelector('.pozisyon')?.value.trim() || '',
                        tarih: grup.querySelector('.tarih')?.value.trim() || '',
                        aciklama: grup.querySelector('.aciklama')?.value.trim() || ''
                    });
                }
            });

            document.querySelectorAll('.yetenek').forEach(input => {
                if (input.value.trim()) veri.yetenekler.push(input.value.trim());
            });

            document.querySelectorAll('.sertifika').forEach(input => {
                if (input.value.trim()) veri.sertifikalar.push(input.value.trim());
            });

            // Fotoğraf İşlemi
            const fotoInput = document.getElementById('fotograf');
            let fotoBase64 = '';
            if (fotoInput.files && fotoInput.files[0]) {
                fotoBase64 = await toBase64(fotoInput.files[0]);
            }

            // --- 3. API İSTEĞİ HAZIRLAMA ---
            
            const prompt = `
            Bir uzman CV yazarı olarak aşağıdaki verileri analiz et ve profesyonel, modern bir CV içeriği oluştur.
            "ekAciklama" kısmını etkileyici bir profesyonel özete dönüştür (maksimum 100 kelime). 
            İş deneyimi açıklamalarını eylem fiilleri kullanarak daha etkili hale getir.
            
            Gelen Veriler:
            İsim: ${veri.ad} ${veri.soyad}
            E-posta: ${veri.email}
            Telefon: ${veri.telefon}
            Adres: ${veri.adres}
            TC: ${veri.tc}
            Eğitim: ${veri.okul}, ${veri.bolum}, Mezuniyet: ${veri.mezuniyetYili}
            Deneyimler: ${JSON.stringify(veri.deneyimler)}
            Yetenekler: ${veri.yetenekler.join(', ')}
            Sertifikalar: ${veri.sertifikalar.join(', ')}
            Ek Açıklama: "${veri.ekAciklama}"
            
            SADECE VE SADECE aşağıdaki yapıda geçerli bir JSON objesi döndür. Başka hiçbir metin veya markdown (```json gibi) ekleme:
            {
              "summary": "geliştirilmiş profesyonel özet metni",
              "experiences": [
                { "sirket": "şirket adı", "pozisyon": "pozisyon adı", "tarih": "tarih", "enhancedDescription": "geliştirilmiş deneyim açıklaması" }
              ],
              "skills": ["yetenek 1", "yetenek 2"],
              "certifications": ["sertifika 1"]
            }
            `;

            // En stabil model: gemini-1.5-flash
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json" // Çıktıyı kesinlikle JSON olmaya zorlar
                    }
                })
            });

            // Hata Kontrolü
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Hatası Detayı:", errorData);
                throw new Error(`API Hatası (${response.status}): ${errorData.error?.message || 'Bilinmeyen API Hatası'}`);
            }

            const responseData = await response.json();
            const aiText = responseData.candidates[0].content.parts[0].text;
            
            // JSON verisini parse et
            const cvData = JSON.parse(aiText);

            // --- 4. CV ÖNİZLEME OLUŞTURMA ---
            
            const previewDiv = document.getElementById('cvPreview');
            let fotoHtml = '';
            if (fotoBase64) {
                fotoHtml = `<img src="${fotoBase64}" style="width:120px; height:120px; object-fit:cover; border-radius:50%; margin-bottom:15px; border: 3px solid #0072ff;">`;
            }
            
            let deneyimHtml = '';
            if(cvData.experiences && cvData.experiences.length > 0) {
                cvData.experiences.forEach(exp => {
                    deneyimHtml += `
                    <div style="margin-bottom:15px; border-left: 2px solid #0072ff; padding-left: 10px;">
                        <div style="font-weight:bold; font-size: 1.1em;">${exp.sirket}</div>
                        <div style="color: #555; margin-bottom: 5px;">${exp.pozisyon} | <em>${exp.tarih}</em></div>
                        <p style="margin:0; font-size: 0.95em;">${exp.enhancedDescription}</p>
                    </div>`;
                });
            } else {
                deneyimHtml = '<p>Deneyim bilgisi girilmedi.</p>';
            }

            previewDiv.innerHTML = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding:40px; max-width:800px; margin:auto; background:#fff; color:#333; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="text-align:center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                        ${fotoHtml}
                        <h1 style="color:#2c3e50; margin: 0 0 10px 0; font-size: 2.5em; text-transform: uppercase; letter-spacing: 1px;">${veri.ad} ${veri.soyad}</h1>
                        <p style="margin: 5px 0; color: #666; font-size: 1.1em;">
                            ${veri.email} | ${veri.telefon}<br>
                            ${veri.adres}
                        </p>
                        ${veri.tc ? `<p style="margin: 5px 0; font-size: 0.9em; color: #999;">TC: ${veri.tc}</p>` : ''}
                    </div>
                    
                    <h2 style="color:#0072ff; border-bottom: 1px solid #0072ff; padding-bottom: 5px; margin-top: 25px;">Profesyonel Özet</h2>
                    <p style="line-height: 1.6;">${cvData.summary}</p>
                    
                    <h2 style="color:#0072ff; border-bottom: 1px solid #0072ff; padding-bottom: 5px; margin-top: 25px;">Eğitim</h2>
                    <p style="font-size: 1.1em;"><strong>${veri.okul}</strong></p>
                    <p style="margin-top: -10px; color: #555;">${veri.bolum} (Mezuniyet: ${veri.mezuniyetYili})</p>
                    
                    <h2 style="color:#0072ff; border-bottom: 1px solid #0072ff; padding-bottom: 5px; margin-top: 25px;">İş Deneyimi</h2>
                    ${deneyimHtml}
                    
                    <h2 style="color:#0072ff; border-bottom: 1px solid #0072ff; padding-bottom: 5px; margin-top: 25px;">Yetenekler</h2>
                    <p style="line-height: 1.6;">
                        ${cvData.skills.map(skill => `<span style="display:inline-block; background:#f0f4f8; padding:5px 10px; margin: 2px 5px 5px 0; border-radius: 4px; color:#2c3e50;">${skill}</span>`).join('')}
                    </p>
                    
                    <h2 style="color:#0072ff; border-bottom: 1px solid #0072ff; padding-bottom: 5px; margin-top: 25px;">Sertifikalar</h2>
                    <ul style="padding-left: 20px; line-height: 1.6;">
                        ${cvData.certifications.length > 0 ? cvData.certifications.map(cert => `<li>${cert}</li>`).join('') : '<li>Belirtilmedi</li>'}
                    </ul>
                </div>
            `;

            // --- 5. PDF OLARAK KAYDETME ---
            const opt = {
                margin: [0, 0],
                filename: `${veri.ad.replace(/\s+/g, '')}_${veri.soyad.replace(/\s+/g, '')}_CV.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // html2pdf kütüphanesinin yüklü olduğundan emin ol
            if (typeof html2pdf !== 'undefined') {
                html2pdf().set(opt).from(previewDiv).save();
            } else {
                alert("PDF oluşturucu kütüphane (html2pdf) yüklenmemiş. Lütfen index.html dosyanı kontrol et.");
            }

        } catch (error) {
            console.error("İşlem sırasında tam hata:", error);
            alert(`Bir hata oluştu!\n\nLütfen API anahtarının yenilendiğinden emin ol.\nDetay: ${error.message}`);
        } finally {
            // Butonu eski haline getir
            btn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    });
});

// Yardımcı Fonksiyon: Dosyayı Base64'e çevirir
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
