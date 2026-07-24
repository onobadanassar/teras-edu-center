// ===== github-sync.js =====
// دوال المزامنة مع GitHub - نسخة معدلة

// ===== حفظ البيانات إلى GitHub =====
window.syncToGitHub = async function() {
  try {
    // جلب البيانات من window.db
    const db = window.db || {};
    
    // جمع كل البيانات
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
    
    console.log('📤 جاري حفظ البيانات:', Object.keys(data).length, 'قسم');
    
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
    
    // التحقق من وجود الملف
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
    
    // تحويل البيانات إلى Base64
    const jsonString = JSON.stringify(data, null, 2);
    const content = btoa(unescape(encodeURIComponent(jsonString)));
    
    // حفظ البيانات
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'تحديث البيانات من النظام - ' + new Date().toLocaleString(),
        content: content,
        sha: sha
      })
    });
    
    if (response.ok) {
      console.log('✅ تم حفظ البيانات في GitHub');
      if (window.toast) window.toast('✅ تم حفظ البيانات في GitHub');
      document.getElementById('githubStatus').innerHTML = '✅ آخر حفظ: ' + new Date().toLocaleString();
    } else {
      const error = await response.json();
      console.error('❌ فشل الحفظ:', error);
      if (window.toast) window.toast('❌ فشل الحفظ: ' + (error.message || 'خطأ غير معروف'));
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    if (window.toast) window.toast('❌ خطأ: ' + error.message);
  }
};

// ===== تحميل البيانات من GitHub =====
window.loadFromGitHub = async function() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        if (window.toast) window.toast('⚠️ لا يوجد ملف بيانات في GitHub. احفظ البيانات أولاً!');
        return;
      }
      throw new Error('فشل التحميل');
    }
    
    const data = await response.json();
    const content = JSON.parse(atob(data.content));
    
    // جلب db من window
    const db = window.db || {};
    
    // استعادة البيانات
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
    
    // حفظ في LocalStorage
    if (typeof window.saveDB === 'function') {
      window.saveDB();
    } else {
      localStorage.setItem('terasUnifiedDB_v5', JSON.stringify(db));
    }
    
    // تحديث الواجهة
    if (typeof window.refreshAllData === 'function') {
      window.refreshAllData();
    }
    
    console.log('✅ تم تحميل البيانات من GitHub');
    if (window.toast) window.toast('✅ تم تحميل البيانات من GitHub بنجاح!');
    document.getElementById('githubStatus').innerHTML = '✅ آخر تحميل: ' + new Date().toLocaleString();
    
  } catch (error) {
    console.error('❌ خطأ في التحميل:', error);
    if (window.toast) window.toast('❌ خطأ في التحميل: ' + error.message);
  }
};

// ===== دالة للحفظ الفوري =====
window.syncNow = async function() {
  if (window.toast) window.toast('🔄 جاري المزامنة...');
  await window.syncToGitHub();
};

// ===== المزامنة التلقائية =====
let autoSyncInterval = null;
let autoSyncEnabled = true;

window.startAutoSync = function() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }
  
  autoSyncInterval = setInterval(async function() {
    if (!autoSyncEnabled) return;
    try {
      await window.syncToGitHub();
    } catch (error) {
      console.error('❌ فشل المزامنة التلقائية:', error);
    }
  }, 5000);
};

window.stopAutoSync = function() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
};

window.toggleAutoSync = function() {
  autoSyncEnabled = !autoSyncEnabled;
  const status = autoSyncEnabled ? '🟢 مفعلة' : '🔴 معطلة';
  if (window.toast) window.toast(`المزامنة التلقائية: ${status}`);
};

// ===== بدء المزامنة التلقائية =====
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    window.startAutoSync();
    console.log('🔄 تم بدء المزامنة التلقائية (كل 5 ثواني)');
  }, 10000);
});
