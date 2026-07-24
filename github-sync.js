// ===== github-sync.js =====
// دوال المزامنة مع GitHub

// ===== حفظ البيانات إلى GitHub =====
async function syncToGitHub() {
  try {
    // استخدام db من النافذة (window)
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
    
    // تشفير البيانات
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    
    // حفظ البيانات
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
      toast('✅ تم حفظ البيانات في GitHub');
    } else {
      const error = await response.json();
      toast('❌ فشل الحفظ: ' + (error.message || 'خطأ غير معروف'));
    }
  } catch (error) {
    console.error(error);
    toast('❌ خطأ: ' + error.message);
  }
}

// ===== تحميل البيانات من GitHub =====
async function loadFromGitHub() {
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
        toast('⚠️ لا يوجد ملف بيانات في GitHub. احفظ البيانات أولاً!');
        return;
      }
      throw new Error('فشل التحميل');
    }
    
    const data = await response.json();
    const content = JSON.parse(atob(data.content));
    
    // استعادة البيانات
    const db = window.db || {};
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
    if (typeof saveDB === 'function') {
      saveDB();
    } else {
      localStorage.setItem('terasUnifiedDB_v5', JSON.stringify(db));
    }
    
    // تحديث الواجهة
    if (typeof refreshAllData === 'function') {
      refreshAllData();
    }
    
    toast('✅ تم تحميل البيانات من GitHub بنجاح!');
  } catch (error) {
    console.error(error);
    toast('❌ خطأ في التحميل: ' + error.message);
  }
}

// ===== دالة لحفظ البيانات فوراً (للمزامنة التلقائية) =====
async function forceSync() {
  await syncToGitHub();
}

// ===== بدء المزامنة التلقائية =====
let autoSyncInterval = null;
let autoSyncEnabled = true;

function startAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }
  
  autoSyncInterval = setInterval(async function() {
    if (!autoSyncEnabled) return;
    try {
      await syncToGitHub();
    } catch (error) {
      console.error('❌ فشل المزامنة التلقائية:', error);
    }
  }, 5000); // كل 5 ثواني
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

function toggleAutoSync() {
  autoSyncEnabled = !autoSyncEnabled;
  const status = autoSyncEnabled ? '🟢 مفعلة' : '🔴 معطلة';
  toast(`المزامنة التلقائية: ${status}`);
}

// ===== بدء المزامنة التلقائية عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    startAutoSync();
  }, 10000);
});
