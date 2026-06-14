const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Local hardhat deploy address placeholder
const CONTRACT_ABI = [
    "function addDocument(string memory _hash) public",
    "function verifyDocument(string memory _hash) public view returns (bool, address, uint256)",
    "event DocumentAdded(string indexed hash, address indexed owner, uint256 timestamp)"
];

let provider;
let signer;
let contract;

// Tab Switching Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Init Web3
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.BrowserProvider(window.ethereum);
        // Prompt user for account connections
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        return true;
    } else {
        showStatus('upload-status', 'Lütfen MetaMask veya uyumlu bir Web3 cüzdanı yükleyin.', 'error');
        return false;
    }
}

// File Selection Handlers
let selectedUploadFile = null;
let selectedVerifyFile = null;

document.getElementById('file-upload').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedUploadFile = e.target.files[0];
        document.getElementById('upload-filename').innerText = selectedUploadFile.name;
        document.getElementById('upload-drop-zone').classList.add('hidden');
        document.getElementById('upload-details').classList.remove('hidden');
    }
});

document.getElementById('file-verify').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedVerifyFile = e.target.files[0];
        document.getElementById('verify-filename').innerText = selectedVerifyFile.name;
        document.getElementById('verify-drop-zone').classList.add('hidden');
        document.getElementById('verify-details').classList.remove('hidden');
    }
});

// Helper for UI status
function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.className = `status-box status-${type}`;
    if (type === 'info') {
        el.innerHTML = `<div class="loader"></div> ${message}`;
    } else if (type === 'success') {
        el.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
    } else {
        el.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${message}`;
    }
    el.classList.remove('hidden');
}

// Upload & Register Document
document.getElementById('btn-register').addEventListener('click', async () => {
    if (!selectedUploadFile) return;

    if (!await initWeb3()) return;

    showStatus('upload-status', 'Belge hash\'i hesaplanıyor...', 'info');

    try {
        // 1. Get Hash from Backend
        const formData = new FormData();
        formData.append('document', selectedUploadFile);

        const hashRes = await fetch('/api/hash', { method: 'POST', body: formData });
        const hashData = await hashRes.json();
        
        if (hashData.error) throw new Error(hashData.error);
        const docHash = hashData.hash;

        showStatus('upload-status', 'MetaMask üzerinden işlemi onaylayın...', 'info');

        // 2. Save to Blockchain
        const tx = await contract.addDocument(docHash);
        showStatus('upload-status', 'Blockchain ağına yazılıyor, lütfen bekleyin...', 'info');
        
        const receipt = await tx.wait(); // Wait for mining

        // 3. Save metadata to Backend DB
        await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hash: docHash,
                filename: selectedUploadFile.name,
                ownerAddress: signer.address,
                txHash: receipt.hash
            })
        });

        showStatus('upload-status', 'Belge başarıyla blockchain ağına kaydedildi!', 'success');
        
        // Reset UI after 3 seconds
        setTimeout(() => {
            document.getElementById('upload-status').classList.add('hidden');
            document.getElementById('upload-details').classList.add('hidden');
            document.getElementById('upload-drop-zone').classList.remove('hidden');
            selectedUploadFile = null;
        }, 4000);

    } catch (err) {
        console.error(err);
        let errorMsg = err.message || "Bir hata oluştu.";
        if (errorMsg.includes("zaten kayitli")) errorMsg = "Bu belge zaten sisteme kaydedilmiş!";
        showStatus('upload-status', errorMsg, 'error');
    }
});

// Verify Document
document.getElementById('btn-verify').addEventListener('click', async () => {
    if (!selectedVerifyFile) return;

    // Optional: initWeb3 to verify directly from contract (read-only doesn't strictly need metamask, 
    // but we'll use it if present, otherwise we could query backend)
    // Actually we will use metamask provider for simplicity
    if (!await initWeb3()) return;

    showStatus('verify-status', 'Belge doğrulanıyor...', 'info');

    try {
        // 1. Get Hash from Backend
        const formData = new FormData();
        formData.append('document', selectedVerifyFile);

        const hashRes = await fetch('/api/hash', { method: 'POST', body: formData });
        const hashData = await hashRes.json();
        
        if (hashData.error) throw new Error(hashData.error);
        const docHash = hashData.hash;

        // 2. Verify on Blockchain
        const result = await contract.verifyDocument(docHash);
        const isRegistered = result[0];
        const owner = result[1];
        const timestamp = new Date(Number(result[2]) * 1000).toLocaleString('tr-TR');

        if (isRegistered) {
            showStatus('verify-status', `
                <div>
                    <strong style="display:block; margin-bottom:5px;">✅ Bu belge orijinal ve kayıtlıdır.</strong>
                    <div style="font-size:0.85rem; color:#d1d5db;">
                        <strong>Tarih:</strong> ${timestamp}<br>
                        <strong>Sahibi (Cüzdan):</strong> ${owner.substring(0,6)}...${owner.substring(38)}
                    </div>
                </div>
            `, 'success');
        } else {
            showStatus('verify-status', '❌ Uyarı: Bu belgenin orijinal olmadığı veya değiştirildiği tespit edildi!', 'error');
        }

    } catch (err) {
        console.error(err);
        showStatus('verify-status', "Doğrulama sırasında bir hata oluştu.", 'error');
    }
});
