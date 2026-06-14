# Blockchain Tabanlı Dijital Noter ve Belge Doğrulama Sistemi 🚀

Bu proje, **Bulut Bilişim** dersi final projesi kapsamında; bulut mimarileri (AWS), NoSQL veritabanı (MongoDB) ve Blockchain (Ethereum/Hardhat) teknolojilerinin birbirine entegre edilerek merkeziyetsiz ve güvenli bir sistem oluşturulması amacıyla geliştirilmiştir.

---

## 🎯 Projenin Amacı
Geleneksel belge doğrulama ve noter süreçleri yavaş, masraflı ve manipülasyona (evrak sahteciliğine) açık olabilmektedir. Bu projenin temel amacı;
* Belgelerin içeriklerini doğrudan paylaşmadan (gizliliği koruyarak),
* Kriptografik şifreleme (SHA-256) algoritmaları kullanarak,
* Belgenin varlığını ve değiştirilmediğini **Blockchain'in değiştirilemez (immutable)** yapısı sayesinde zaman damgasıyla kanıtlamaktır.

Bu sistem, diplomalar, telif hakları, resmi sözleşmeler ve sağlık raporları gibi kritik belgelerin doğruluğunu saniyeler içinde kanıtlamak için kullanılabilir.

---

## 🏗️ Kullanılan Teknolojiler ve Sistem Mimarisi

Proje 3 temel sacayağı üzerine inşa edilmiştir: **Frontend & Backend (Sunucu), Bulut Veritabanı (Off-chain) ve Blockchain Ağı (On-chain).**

### 1. Bulut Bilişim & Sunucu Mimarisi (AWS)
* **AWS Elastic Beanstalk (PaaS):** Node.js tabanlı uygulamanın internete açılması, sunucu yönetiminin (EC2) ve yük dengelemenin (Load Balancing) yapılması için AWS kullanılmıştır.
* **Backend:** `Node.js` ve `Express.js` kullanılarak RESTful API'ler oluşturulmuştur.

### 2. Veritabanı Katmanı (MongoDB Atlas)
* **Bulut Veritabanı:** Blockchain üzerinde büyük veriler (resim, pdf, uzun metinler) saklamak yüksek işlem ücretlerine (Gas Fee) yol açar. Bu nedenle hibrit bir mimari kurularak, sadece belgenin dijital parmak izi (Hash) Blockchain'e atılmış; belgenin adı gibi *off-chain* veriler **MongoDB Atlas** bulut veritabanında saklanmıştır.

### 3. Blockchain Katmanı (Web3 & Solidity)
* **Hardhat:** Kendi yerel Ethereum ağımızı (`localhost:8545`) oluşturmak ve yönetmek için kullanılmıştır.
* **Akıllı Sözleşme (Smart Contract):** `Solidity` dili ile yazılan `DocumentRegistry.sol` sözleşmesi, belgelerin hash'lerini ve sahiplerinin cüzdan adreslerini haritalayarak (mapping) Blockchain'e kaydetmektedir.
* **Ethers.js & MetaMask:** Frontend ile Blockchain arasındaki köprüyü kurmak ve kullanıcıların kendi özel anahtarları (Private Key) ile işlemleri dijital olarak imzalamasını sağlamak için entegre edilmiştir.

---

## 🔄 Sistem Nasıl Çalışıyor? (İş Akışı)

1. **Belge Yükleme (Kriptografik İşlem):** Kullanıcı arayüz üzerinden bir dosya seçer. Dosyanın kendisi sunucuya gönderilmez. Tarayıcı tarafında (Client-side) dosyanın eşsiz bir **SHA-256 Hash (Dijital Parmak İzi)** değeri oluşturulur.
2. **Blockchain'e Kayıt:** Oluşturulan bu Hash, Ethers.js aracılığıyla MetaMask'e gönderilir. Kullanıcı işlem ücretini onayladığında Hash, Akıllı Sözleşme tarafından blokzincire kalıcı olarak yazılır.
3. **Veritabanı Yedekleme:** Başarılı işlem sonucunda, belge adı ve işlem ID'si MongoDB'ye kaydedilir.
4. **Belge Doğrulama:** Daha sonra biri aynı belgeyi sisteme yüklediğinde, belgenin hash'i tekrar çıkarılır ve Blockchain'e "Bu hash daha önce kaydedilmiş mi?" diye sorulur. Dosyanın tek bir karakteri bile değiştirilmişse hash eşleşmeyeceği için sistem belgenin sahte olduğunu anında tespit eder.

---

## 🛠️ Kurulum ve Geliştirme Adımları

Projeyi kendi yerel bilgisayarınızda (Localhost) çalıştırmak için şu adımları izleyebilirsiniz:

### Adım 1: Bağımlılıkların Yüklenmesi
```bash
npm install
```

### Adım 2: Yerel Blockchain Ağını Başlatma
Yeni bir terminal açıp ağ düğümünü (Node) başlatın:
```bash
npx hardhat node
```

### Adım 3: Akıllı Sözleşmeyi Ağa Dağıtma (Deploy)
Ağ çalışırken farklı bir terminalde sözleşmeyi Blockchain'e yükleyin:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Adım 4: Ortam Değişkenleri (.env)
Ana dizinde bir `.env` dosyası oluşturun ve MongoDB linkinizi ekleyin:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<kullanici_adi>:<sifre>@cluster.mongodb.net/?retryWrites=true&w=majority
```

### Adım 5: Sunucuyu Başlatma
```bash
npm start
```
Artık tarayıcınızdan `http://localhost:3000` adresine giderek sistemi kullanabilirsiniz.

---

## ☁️ AWS (Amazon Web Services) Dağıtım Süreci

Bu proje, yerel ortamdan Bulut ortamına şu adımlarla taşınmıştır:
1. Kaynak kodlar (`node_modules` hariç) .zip formatında sıkıştırıldı.
2. AWS Elastic Beanstalk panelinden yeni bir **Node.js Environment** oluşturuldu.
3. IAM (Identity and Access Management) üzerinden `aws-elasticbeanstalk-service-role` ve `EC2 instance profile` yetkileri ayarlandı.
4. Çevre değişkenleri sekmesinden `PORT=8080` ve `MONGODB_URI` değerleri AWS sunucusuna tanıtıldı.
5. .zip dosyası yüklenerek uygulamanın public bir URL üzerinden tüm dünyaya hizmet vermesi sağlandı.

---
*Bu proje modern web mimarisi, bulut servisleri ve dağıtık veri teknolojilerinin başarılı bir şekilde entegre edilebileceğini kanıtlamaktadır.*
