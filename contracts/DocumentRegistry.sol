// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DocumentRegistry {
    // Belge verilerini tutacak yapı (Struct)
    struct Document {
        string hash; // Belgenin SHA-256 hash'i
        address owner; // Belgeyi yükleyen cüzdan adresi
        uint256 timestamp; // Kayıt zamanı
        bool isRegistered; // Kayıtlı olup olmadığı
    }

    // Hash üzerinden belgeye ulaşmak için Mapping
    mapping(string => Document) public documents;

    // Yeni belge eklendiğinde tetiklenecek olay (Event)
    event DocumentAdded(string indexed hash, address indexed owner, uint256 timestamp);

    // Yeni belge ekleme fonksiyonu
    function addDocument(string memory _hash) public {
        // Belge daha önce eklenmemiş olmalı
        require(!documents[_hash].isRegistered, "Bu belge zaten kayitli!");

        // Belgeyi kaydet
        documents[_hash] = Document({
            hash: _hash,
            owner: msg.sender,
            timestamp: block.timestamp,
            isRegistered: true
        });

        // Olayı tetikle (Log)
        emit DocumentAdded(_hash, msg.sender, block.timestamp);
    }

    // Belge doğrulama fonksiyonu
    function verifyDocument(string memory _hash) public view returns (bool, address, uint256) {
        Document memory doc = documents[_hash];
        // Eğer belge varsa true, sahibini ve zamanını döndür
        if (doc.isRegistered) {
            return (true, doc.owner, doc.timestamp);
        } else {
            return (false, address(0), 0);
        }
    }
}
