import { createClient } from '@supabase/supabase-js';
import './style.css';

const $ = (id) => document.getElementById(id);
const config = { url: import.meta.env.VITE_SUPABASE_URL, key: import.meta.env.VITE_SUPABASE_ANON_KEY };
const configured = Boolean(config.url && config.key && !config.url.includes('YOUR_PROJECT_ID') && !config.key.includes('YOUR_SUPABASE'));
const supabase = configured ? createClient(config.url, config.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
const money = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let receipts = [];
let activeReceipt = null;

function setStatus(text, ok = false) { $('connectionStatus').textContent = text; $('connectionStatus').classList.toggle('online', ok); }
function setMessage(id, text, error = false) { const node = $(id); node.textContent = text; node.classList.toggle('error', error); }
function amount(id, label) { const value = Number($(id).value); if ($(id).value.trim() === '' || !Number.isFinite(value) || value < 0) throw new Error(`أدخل قيمة صحيحة في حقل ${label}.`); return value; }
function showSignedIn(session) { const signedIn = Boolean(session); $('loginView').hidden = signedIn; $('appView').hidden = !signedIn; $('logoutButton').hidden = !signedIn; setStatus(signedIn ? 'متصل بقاعدة البيانات' : configured ? 'سجّل الدخول' : 'أكمل إعداد قاعدة البيانات', signedIn); if (signedIn) loadReceipts(); }
function errorMessage(error) { return error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.'; }

if (!configured) {
  setStatus('إعداد قاعدة البيانات مطلوب');
  $('loginMessage').textContent = 'أنشئ مشروع Supabase، ثم أضف عنوان المشروع ومفتاح publishable/anon إلى ملف .env المحلي. راجع README.';
  $('loginMessage').classList.add('error');
  $('loginForm').querySelector('button').disabled = true;
}

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault(); if (!supabase) return;
  const button = $('loginForm').querySelector('button'); button.disabled = true; setMessage('loginMessage', 'جارٍ تسجيل الدخول…');
  const { data, error } = await supabase.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
  button.disabled = false;
  if (error) { setMessage('loginMessage', errorMessage(error), true); return; }
  setMessage('loginMessage', 'تم تسجيل الدخول.'); showSignedIn(data.session);
});
$('logoutButton').addEventListener('click', async () => { const { error } = await supabase.auth.signOut(); if (error) { alert(errorMessage(error)); return; } receipts = []; showSignedIn(null); });
if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => showSignedIn(session));
  supabase.auth.getSession().then(({ data, error }) => { if (error) setMessage('loginMessage', errorMessage(error), true); showSignedIn(data?.session ?? null); });
}

for (const tab of document.querySelectorAll('.tab')) tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === tab.dataset.view));
  if (tab.dataset.view === 'history') loadReceipts();
});

$('calculateButton').addEventListener('click', () => {
  try { const price = amount('price', 'السعر'); if (price <= 0) throw new Error('السعر يجب أن يكون أكبر من صفر.'); const profitRate = amount('profitRate', 'نسبة الربح') / 100; const taxRate = amount('taxRate', 'الضريبة') / 100; const profit = price * profitRate; const subtotal = price + profit; const tax = subtotal * taxRate; $('calculationResult').textContent = `السعر الأساسي: ${money.format(price)} ج.م\nهامش الربح: +${money.format(profit)} ج.م\nالضريبة: +${money.format(tax)} ج.م\nالإجمالي: ${money.format(subtotal + tax)} ج.م`; } catch (error) { alert(errorMessage(error)); }
});
$('staffButton').addEventListener('click', () => {
  try { const received = amount('received', 'المبالغ المستلمة'); const spent = amount('spent', 'المبالغ المصروفة'); const sales = amount('sales', 'المبيعات'); const rate = amount('commissionRate', 'نسبة العمولة'); $('staffResult').textContent = `الموظف: ${$('employeeName').value.trim() || 'غير محدد'}\nالمتبقي في العهدة: ${money.format(received - spent)} ج.م\nالعمولة (${rate}%): ${money.format(sales * rate / 100)} ج.م`; } catch (error) { alert(errorMessage(error)); }
});

function receiptText(item) { return ['مكتب عاطف وهبة للخدمات العامة', 'إيصال تسجيل معاملة', '────────────────────', `رقم الإيصال: ${item.id}`, `التاريخ: ${new Date(item.created_at).toLocaleString('ar-EG')}`, `اسم العميل: ${item.customer_name}`, item.phone ? `الهاتف: ${item.phone}` : '', `الخدمة: ${item.service}`, `الحالة: ${item.status}`, item.amount !== null ? `المبلغ المسجل: ${money.format(Number(item.amount))} ج.م` : '', '────────────────────', 'هذا الإيصال يثبت تسجيل المعاملة فقط، ولا يثبت إتمامها أو سداد المبلغ إلا إذا ذُكر ذلك صراحة.', 'شكراً لثقتكم بنا.'].filter(Boolean).join('\n'); }
function openReceipt(item) { activeReceipt = item; $('receiptPreview').textContent = receiptText(item); $('receiptDialog').showModal(); }
$('closeDialog').addEventListener('click', () => $('receiptDialog').close());
$('receiptForm').addEventListener('submit', async (event) => {
  event.preventDefault(); if (!supabase) return;
  const button = $('receiptForm').querySelector('button[type="submit"]'); button.disabled = true; setMessage('receiptMessage', 'جارٍ الحفظ…');
  const amountValue = $('amount').value.trim() === '' ? null : Number($('amount').value);
  if (amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0)) { button.disabled = false; setMessage('receiptMessage', 'أدخل مبلغاً صحيحاً أو اترك الحقل فارغاً.', true); return; }
  const record = { customer_name: $('customer').value.trim(), phone: $('phone').value.trim() || null, service: $('service').value.trim(), amount: amountValue, status: $('receiptStatus').value };
  const { data, error } = await supabase.from('receipts').insert(record).select().single();
  button.disabled = false;
  if (error) { setMessage('receiptMessage', `تعذر حفظ الإيصال: ${errorMessage(error)}`, true); return; }
  $('receiptForm').reset(); setMessage('receiptMessage', 'تم حفظ الإيصال في قاعدة البيانات.'); await loadReceipts(); openReceipt(data);
});

async function loadReceipts() {
  if (!supabase) return;
  $('receiptList').innerHTML = '<p class="muted">جارٍ تحميل الإيصالات…</p>';
  const { data, error } = await supabase.from('receipts').select('id,customer_name,phone,service,amount,status,created_at').order('created_at', { ascending: false }).limit(500);
  if (error) { $('receiptList').textContent = `تعذر تحميل السجل: ${errorMessage(error)}`; return; }
  receipts = data || []; renderReceipts(); setStatus('متصل بقاعدة البيانات', true);
}
function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function renderReceipts() {
  const query = $('search').value.trim().toLocaleLowerCase();
  const matches = receipts.filter((item) => `${item.customer_name} ${item.service} ${item.status}`.toLocaleLowerCase().includes(query));
  if (!matches.length) { $('receiptList').innerHTML = `<div class="empty">${query ? 'لا توجد نتائج مطابقة.' : 'لا توجد إيصالات بعد.'}</div>`; return; }
  $('receiptList').innerHTML = matches.map((item) => `<article class="receipt"><div class="receipt-top"><div><b>${escapeHTML(item.customer_name)}</b><small>${escapeHTML(item.service)}</small><small>${escapeHTML(new Date(item.created_at).toLocaleString('ar-EG'))}</small></div><span class="badge">${escapeHTML(item.status)}</span></div><div class="receipt-actions"><button class="button button-light" data-open="${escapeHTML(item.id)}">عرض الإيصال</button><button class="button button-danger" data-delete="${escapeHTML(item.id)}">حذف</button></div></article>`).join('');
  $('receiptList').querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => { const item = receipts.find((receipt) => String(receipt.id) === button.dataset.open); if (item) openReceipt(item); }));
  $('receiptList').querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', async () => { if (!confirm('هل تريد حذف هذا الإيصال نهائياً؟')) return; button.disabled = true; const { error } = await supabase.from('receipts').delete().eq('id', button.dataset.delete); if (error) { button.disabled = false; alert(errorMessage(error)); return; } await loadReceipts(); }));
}
$('search').addEventListener('input', renderReceipts);
$('refreshButton').addEventListener('click', loadReceipts);
$('exportButton').addEventListener('click', () => { const blob = new Blob([JSON.stringify(receipts, null, 2)], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'atef-receipts-backup.json'; link.click(); URL.revokeObjectURL(url); });
$('shareButton').addEventListener('click', async () => { if (!activeReceipt) return; const text = receiptText(activeReceipt); try { if (navigator.share) await navigator.share({ title: 'إيصال مكتب عاطف وهبة', text }); else { await navigator.clipboard.writeText(text); alert('تم نسخ الإيصال.'); } } catch (error) { if (error.name !== 'AbortError') alert('تعذرت مشاركة الإيصال.'); } });
$('printButton').addEventListener('click', () => { if (!activeReceipt) return; const popup = window.open('', '_blank'); if (!popup) { alert('اسمح بفتح النوافذ المنبثقة للطباعة.'); return; } const content = escapeHTML(receiptText(activeReceipt)); popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>إيصال</title><style>body{font-family:Arial,sans-serif;padding:32px;line-height:2;white-space:pre-wrap}</style><body>${content}</body></html>`); popup.document.close(); popup.print(); });
