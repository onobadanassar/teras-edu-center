async function syncToGitHub() {
  try {
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
      toast('✅ تم حفظ البيانات في GitHub');
    } else {
      toast('❌ فشل الحفظ');
    }
  } catch (error) {
    console.error(error);
    toast('❌ خطأ: ' + error.message);
  }
}

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
        toast('⚠️ لا يوجد ملف بيانات في GitHub');
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
    
    saveDB();
    refreshAllData();
    toast('✅ تم تحميل البيانات من GitHub بنجاح!');
  } catch (error) {
    console.error(error);
    toast('❌ خطأ في التحميل: ' + error.message);
  }
}
// ===== مزامنة تلقائية كل 5 ثواني =====
let autoSyncInterval = null;
let autoSyncEnabled = true;

// ===== تشغيل المزامنة التلقائية =====
function startAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }
  
  autoSyncInterval = setInterval(async function() {
    if (!autoSyncEnabled) return;
    
    // تحقق من وجود تغييرات (اختياري)
    try {
      // حفظ البيانات تلقائياً
      await syncToGitHub();
      console.log('🔄 مزامنة تلقائية:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ فشل المزامنة التلقائية:', error);
    }
  }, 5000); // 5000 ميلي ثانية = 5 ثواني
}

// ===== إيقاف المزامنة التلقائية =====
function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('⏹️ تم إيقاف المزامنة التلقائية');
  }
}

// ===== تبديل حالة المزامنة التلقائية =====
function toggleAutoSync() {
  autoSyncEnabled = !autoSyncEnabled;
  const status = autoSyncEnabled ? '🟢 مفعلة' : '🔴 معطلة';
  toast(`المزامنة التلقائية: ${status}`);
  console.log(`المزامنة التلقائية: ${status}`);
}

// ===== بدء المزامنة التلقائية عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
  // انتظر 10 ثواني قبل بدء المزامنة التلقائية
  setTimeout(function() {
    startAutoSync();
    console.log('🔄 تم بدء المزامنة التلقائية (كل 5 ثواني)');
  }, 10000);
});
