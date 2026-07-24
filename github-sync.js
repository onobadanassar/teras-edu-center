// ===== github-sync.js =====

async function syncToGitHub() {
  try {
    if (typeof toast === 'function') toast('🔄 جاري الحفظ...');
    console.log('🔄 جاري حفظ البيانات في GitHub...');
    
    const data = {
      employees: db.employees || [],
      students: db.students || [],
      payments: db.payments || [],
      materials: db.materials || [],
      expenses: db.expenses || [],
      receipts: db.receipts || [],
      rooms: db.rooms || [],
      courses: db.courses || [],
      schedule: db.schedule || {},
      masterSchedule: db.masterSchedule || [],
      announcements: db.announcements || [],
      pricePlans: db.pricePlans || [],
      settings: db.settings || {}
    };
    
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
    
    let sha = '';
    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (getResponse.ok) {
      const existing = await getResponse.json();
      sha = existing.sha;
    }
    
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'تحديث البيانات من النظام',
        content: content,
        sha: sha
      })
    });
    
    if (response.ok) {
      if (typeof toast === 'function') toast('✅ تم حفظ البيانات في GitHub');
      console.log('✅ تم حفظ البيانات في GitHub');
      document.getElementById('githubStatus').innerHTML = '✅ آخر حفظ: ' + new Date().toLocaleString();
    } else {
      const error = await response.json();
      console.error('❌ فشل الحفظ:', error);
      if (typeof toast === 'function') toast('❌ فشل الحفظ: ' + (error.message || 'خطأ غير معروف'));
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    if (typeof toast === 'function') toast('❌ خطأ: ' + error.message);
  }
}

async function loadFromGitHub() {
  try {
    if (typeof toast === 'function') toast('🔄 جاري التحميل...');
    console.log('🔄 جاري تحميل البيانات من GitHub...');
    
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        if (typeof toast === 'function') toast('⚠️ لا يوجد ملف بيانات في GitHub');
        return;
      }
      throw new Error('فشل التحميل');
    }
    
    const data = await response.json();
    const content = JSON.parse(atob(data.content));
    
    db.employees = content.employees || [];
    db.students = content.students || [];
    db.payments = content.payments || [];
    db.materials = content.materials || [];
    db.expenses = content.expenses || [];
    db.receipts = content.receipts || [];
    db.rooms = content.rooms || [];
    db.courses = content.courses || [];
    db.schedule = content.schedule || null;
    db.masterSchedule = content.masterSchedule || [];
    db.announcements = content.announcements || [];
    db.pricePlans = content.pricePlans || [];
    if (content.settings) db.settings = content.settings;
    
    if (typeof saveDB === 'function') saveDB();
    if (typeof refreshAllData === 'function') refreshAllData();
    
    if (typeof toast === 'function') toast('✅ تم تحميل البيانات من GitHub بنجاح!');
    console.log('✅ تم تحميل البيانات من GitHub');
    document.getElementById('githubStatus').innerHTML = '✅ آخر تحميل: ' + new Date().toLocaleString();
  } catch (error) {
    console.error('❌ خطأ في التحميل:', error);
    if (typeof toast === 'function') toast('❌ خطأ في التحميل: ' + error.message);
  }
}

function toggleAutoSync() {
  if (typeof window.autoSyncEnabled === 'undefined') {
    window.autoSyncEnabled = true;
  }
  window.autoSyncEnabled = !window.autoSyncEnabled;
  const status = window.autoSyncEnabled ? '🟢 مفعلة' : '🔴 معطلة';
  if (typeof toast === 'function') toast('المزامنة التلقائية: ' + status);
  console.log('المزامنة التلقائية: ' + status);
  
  const statusEl = document.getElementById('autoSyncStatus');
  if (statusEl) {
    statusEl.textContent = window.autoSyncEnabled ? '🔄 المزامنة التلقائية: مفعلة (كل 5 ثواني)' : '⏹️ المزامنة التلقائية: معطلة';
    statusEl.style.color = window.autoSyncEnabled ? '#5fe3a8' : '#ff6b6b';
  }
}

// ===== بدء المزامنة التلقائية =====
let autoSyncInterval = null;
window.autoSyncEnabled = true;

function startAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }
  
  autoSyncInterval = setInterval(async function() {
    if (!window.autoSyncEnabled) return;
    try {
      await syncToGitHub();
    } catch (error) {
      console.error('❌ فشل المزامنة التلقائية:', error);
    }
  }, 5000);
  
  console.log('🔄 تم بدء المزامنة التلقائية (كل 5 ثواني)');
}

// ===== بدء المزامنة عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    startAutoSync();
  }, 10000);
});

console.log('✅ github-sync.js تم تحميله بنجاح!');
