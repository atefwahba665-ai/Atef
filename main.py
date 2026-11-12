# -*- coding: utf-8 -*-
"""
مكتب عاطف وهبة للخدمات العامة - نسخة الموبايل (Kivy)
بناء الـ APK يتم عبر Buildozer
"""
import os
import arabic_reshaper
from bidi.algorithm import get_display

from kivy.app import App
from kivy.core.window import Window
from kivy.utils import get_color_from_hex
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.button import Button
from kivy.uix.tabbedpanel import TabbedPanel, TabbedPanelItem

Window.clearcolor = get_color_from_hex("#f5f7fa")


def ar(text):
    """تجهيز النص العربي ليظهر متصلاً وباتجاه صحيح داخل Kivy"""
    return get_display(arabic_reshaper.reshape(str(text)))


# خط عربي اختياري: ضع ملف Cairo-Regular.ttf داخل مجلد fonts ليظهر بشكل أجمل
FONT = "Roboto"
if os.path.exists("fonts/Cairo-Regular.ttf"):
    from kivy.core.text import LabelBase
    LabelBase.register(name="Cairo", fn_regular="fonts/Cairo-Regular.ttf")
    FONT = "Cairo"


def make_label(text, size=15, color="#1e3d59", bg=None, bold_size=None, markup=False):
    l = Label(
        text=ar(text),
        font_size=bold_size or size,
        font_name=FONT,
        color=get_color_from_hex(color),
        background_color=get_color_from_hex(bg) if bg else (0, 0, 0, 0),
        size_hint_y=None,
        height="42dp",
        halign="right",
        valign="middle",
        padding=("10dp", "5dp"),
    )
    l.bind(size=lambda inst, val: setattr(inst, "text_size", val))
    return l


def make_input(hint):
    t = TextInput(
        hint_text=ar(hint),
        font_name=FONT,
        font_size="16sp",
        multiline=False,
        input_filter=None,
        size_hint_y=None,
        height="45dp",
        padding=("10dp", "10dp"),
        background_color=get_color_from_hex("#ffffff"),
        hint_text_color=get_color_from_hex("#888888"),
    )
    return t


def make_button(text, color):
    return Button(
        text=ar(text),
        font_name=FONT,
        font_size="16sp",
        bold=True,
        background_color=get_color_from_hex(color),
        color=get_color_from_hex("#ffffff"),
        size_hint_y=None,
        height="50dp",
    )


def make_result():
    l = Label(
        text="",
        font_name=FONT,
        font_size="15sp",
        color=get_color_from_hex("#222222"),
        background_color=get_color_from_hex("#f0f0f0"),
        size_hint_y=None,
        padding=("10dp", "10dp"),
        halign="right",
        valign="top",
    )
    l.height = "200dp"
    l.bind(size=lambda inst, val: setattr(inst, "text_size", val))
    return l


class AtefApp(App):
    def build(self):
        self.title = ar("مكتب عاطف وهبة للخدمات العامة")
        root = BoxLayout(orientation="vertical", padding="10dp", spacing="5dp")

        root.add_widget(make_label("مكتب عاطف وهبة للخدمات العامة",
                                   bold_size="20sp", color="#1e3d59"))

        tp = TabbedPanel(do_default_tab=False, tab_height="45dp",
                         background_color=get_color_from_hex("#1e3d59"))
        root.add_widget(tp)

        # ================= 1. حاسبة التقسيط =================
        tab1 = TabbedPanelItem(text=ar("حاسبة التقسيط"))
        b1 = BoxLayout(orientation="vertical", padding="10dp", spacing="6dp")
        b1.add_widget(make_label("أدخل السعر الأساسي للخدمة أو المنتج (جنيه):"))
        self.entry_price = make_input("مثال: 1000")
        self.entry_price.input_filter = "float"
        b1.add_widget(self.entry_price)
        btn1 = make_button("احسب الإجمالي والتقسيط", "#4CAF50")
        btn1.bind(on_release=self.calc_installments)
        b1.add_widget(btn1)
        self.result1 = make_result()
        b1.add_widget(self.result1)
        tab1.add_widget(b1)
        tp.add_widget(tab1)

        # ================= 2. حسابات الموظفين =================
        tab2 = TabbedPanelItem(text=ar("حسابات الموظفين"))
        b2 = BoxLayout(orientation="vertical", padding="10dp", spacing="6dp")
        b2.add_widget(make_label("اسم الموظف:"))
        self.entry_emp_name = make_input("اسم الموظف")
        b2.add_widget(self.entry_emp_name)
        b2.add_widget(make_label("إجمالي المبالغ المستلمة للتسويق:"))
        self.entry_received = make_input("0")
        self.entry_received.input_filter = "float"
        b2.add_widget(self.entry_received)
        b2.add_widget(make_label("إجمالي المبالغ المصروفة:"))
        self.entry_spent = make_input("0")
        self.entry_spent.input_filter = "float"
        b2.add_widget(self.entry_spent)
        b2.add_widget(make_label("إجمالي حجم المبيعات / التسويق:"))
        self.entry_sales = make_input("0")
        self.entry_sales.input_filter = "float"
        b2.add_widget(self.entry_sales)
        btn2 = make_button("احسب عهدة وعمولة الموظف", "#2196F3")
        btn2.bind(on_release=self.calc_employee)
        b2.add_widget(btn2)
        self.result2 = make_result()
        b2.add_widget(self.result2)
        tab2.add_widget(b2)
        tp.add_widget(tab2)

        # ================= 3. إيصال العميل =================
        tab3 = TabbedPanelItem(text=ar("إيصال العميل"))
        b3 = BoxLayout(orientation="vertical", padding="10dp", spacing="6dp")
        b3.add_widget(make_label("اسم العميل:"))
        self.entry_cust_name = make_input("اسم العميل")
        b3.add_widget(self.entry_cust_name)
        b3.add_widget(make_label("تفاصيل المعاملة / الخدمة:"))
        self.entry_service = make_input("التفاصيل")
        b3.add_widget(self.entry_service)
        btn3 = make_button("إصدار الإيصال للمعاملة", "#FF9800")
        btn3.bind(on_release=self.generate_receipt)
        b3.add_widget(btn3)
        btn_share = make_button("مشاركة الإيصال (واتساب...)", "#9C27B0")
        btn_share.bind(on_release=self.share_receipt)
        b3.add_widget(btn_share)
        self.result3 = make_result()
        self.result3.background_color = get_color_from_hex("#fffde7")
        b3.add_widget(self.result3)
        tab3.add_widget(b3)
        tp.add_widget(tab3)

        return root

    # ---------- العمليات ----------
    def calc_installments(self, *args):
        try:
            price = float(self.entry_price.text or 0)
        except ValueError:
            self.result1.text = ar("يرجى إدخال رقم صحيح للسعر!")
            return
        profit = price * 0.20          # هامش ربح 20%
        subtotal = price + profit
        tax = subtotal * 0.05          # ضريبة مبيعات 5%
        total = subtotal + tax
        self.result1.text = ar(
            f"السعر الأساسي: {price:.2f} ج.م\n"
            f"هامش الربح (20%): +{profit:.2f} ج.م\n"
            f"ضريبة المبيعات (5%): +{tax:.2f} ج.م\n"
            f"---------------------------------\n"
            f"الإجمالي النهائي: {total:.2f} ج.م"
        )

    def calc_employee(self, *args):
        try:
            rec = float(self.entry_received.text or 0)
            spt = float(self.entry_spent.text or 0)
            sales = float(self.entry_sales.text or 0)
        except ValueError:
            self.result2.text = ar("يرجى التأكد من إدخال أرقام صحيحة!")
            return
        remaining = rec - spt
        commission = sales * 0.009     # عمولة 0.9%
        name = self.entry_emp_name.text.strip()
        header = f"الموظف: {name}\n" if name else ""
        self.result2.text = ar(
            header +
            f"المتبقي لدى الموظف: {remaining:.2f} ج.م\n"
            f"عمولة الموظف (0.9%): {commission:.2f} ج.م"
        )

    def generate_receipt(self, *args):
        c_name = self.entry_cust_name.text.strip()
        c_serv = self.entry_service.text.strip()
        if not c_name or not c_serv:
            self.result3.text = ar("يرجى إدخال اسم العميل وتفاصيل المعاملة!")
            return
        self.receipt_text = (
            "--- مكتب عاطف وهبة للخدمات العامة ---\n"
            f"اسم العميل: {c_name}\n"
            f"الخدمة: {c_serv}\n"
            f"الحالة: تم إتمام المعاملة بنجاح\n"
            "---------------------------------\n"
            "شكراً لتعاملكم معنا"
        )
        self.result3.text = ar(self.receipt_text)

    def share_receipt(self, *args):
        if not getattr(self, "receipt_text", None):
            self.result3.text = ar("أصدر الإيصال أولاً ثم شاركه!")
            return
        try:
            from plyer import share
            share.share(text=self.receipt_text)
        except Exception:
            self.result3.text = ar("المشاركة غير متاحة على هذا الجهاز.")


if __name__ == "__main__":
    AtefApp().run()
