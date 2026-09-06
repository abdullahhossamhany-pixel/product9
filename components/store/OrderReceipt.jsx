const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { format } from "date-fns";

export default function OrderReceipt({ order }) {
  const handlePrint = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const el = document.getElementById("receipt-content");
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=420,height=900");
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>body { margin: 0; padding: 0; } img { width: 100%; display: block; }</style>
      </head><body><img src="${imgData}" /></body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {win.print();win.close();}, 500);
  };

  const handleDownload = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");
    const el = document.getElementById("receipt-content");
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pxToMm = (px) => px * 0.264583;
    const width = pxToMm(canvas.width / 2);
    const height = pxToMm(canvas.height / 2);
    const doc = new jsPDF({ unit: "mm", format: [width, height] });
    doc.addImage(imgData, "PNG", 0, 0, width, height);
    doc.save(`receipt-${order.id?.slice(-8)}.pdf`);
  };

  const giftCardItems = (order.items || []).filter((item) => item.is_gift_card);
  const paymentLabel = order.payment_method === "instapay" ? "📱 INSTAPAY RECEIPT" : "💵 CASH RECEIPT";
  const receiptDate = format(new Date(order.placedAt || order.created_date || new Date()), "dd MMM yyyy");
  const receiptTime = format(new Date(order.placedAt || order.created_date || new Date()), "hh:mm a");

  return (
    <div className="w-full">
      {/* Printable receipt */}
      <div id="receipt-content" className="bg-white border border-stone-200 rounded-2xl text-black font-mono text-sm w-full max-w-[300px] sm:max-w-xs mx-auto p-5 sm:p-7">

        {/* Header */}
        <div className="text-center border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
          <p className="text-xs font-bold tracking-widest" style={{ marginBottom: "8px" }}>{paymentLabel}</p>
          <h2 className="text-2xl font-bold tracking-widest" style={{ marginBottom: "10px" }}>🛍️ RECEIPT</h2>
          <p className="text-xs" style={{ marginBottom: "4px" }}>Order ID: #{order.id?.slice(-10).toUpperCase()}</p>
          <p className="text-sm font-semibold" style={{ marginBottom: "2px" }}>{receiptDate}</p>
          <p className="text-xs" style={{ marginBottom: "8px" }}>{receiptTime}</p>
          <p className="text-xs underline">chipso.db.app</p>
        </div>

        {/* Customer Info */}
        <div className="border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
          <p className="font-bold text-xs uppercase tracking-wider" style={{ marginBottom: "12px" }}>📋 Customer Details</p>
          <div className="text-xs" style={{ lineHeight: "1.8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#666" }}>Name</span>
              <span style={{ fontWeight: "600" }}>{order.customerName || order.customer_name || "Guest"}</span>
            </div>
            {order.customer_email &&
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#666" }}>Email</span>
                <span style={{ fontWeight: "600", wordBreak: "break-all", textAlign: "right", maxWidth: "60%" }}>{order.customer_email}</span>
              </div>
            }
            {order.city &&
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#666" }}>City</span>
                <span style={{ fontWeight: "600" }}>{order.city}</span>
              </div>
            }
            {(order.address || order.shipping_address) &&
            <div style={{ marginTop: "10px" }}>
                <span style={{ color: "#666", display: "block", marginBottom: "4px" }}>📍 Address</span>
                <span style={{ fontWeight: "600", display: "block", lineHeight: "1.5" }}>{order.address || order.shipping_address}</span>
              </div>
            }
          </div>
        </div>

        {/* Payment Method */}
        <div className="border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
          <p className="font-bold text-xs uppercase tracking-wider" style={{ marginBottom: "12px" }}>💳 Payment Method</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ color: "#666" }}>Method</span>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>
              {order.payment_method === "instapay" ? "📱 InstaPay" : "💵 Cash on Delivery"}
            </span>
          </div>
          {order.payment_method === "instapay" &&
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "8px" }}>
              <span style={{ color: "#666" }}>Send to</span>
              <span style={{ fontWeight: "600" }}>01101096853</span>
            </div>
          }
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
          <p className="font-bold text-xs uppercase tracking-wider" style={{ marginBottom: "12px" }}>🛒 Items Ordered</p>
          {(order.items || []).map((item, i) =>
          <div key={i} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", marginBottom: "3px" }}>
                <span style={{ flex: 1, paddingRight: "8px" }}>{item.product_name}{item.variant ? ` (${item.variant})` : ""}</span>
                <span>SAR {(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#777" }}>
                Qty: {item.quantity} × SAR {Number(item.price).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Promo codes */}
        {(order.appliedPromos?.length > 0 || order.promo_used) &&
        <div className="border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
            <p className="font-bold text-xs uppercase tracking-wider" style={{ marginBottom: "10px" }}>🎁 Promo Applied</p>
            <p className="font-mono font-bold text-sm">
              {order.appliedPromos ? order.appliedPromos.map((p) => p.code).join(", ") : order.promo_used}
            </p>
          </div>
        }

        {/* Totals */}
        <div className="border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
          <p className="font-bold text-xs uppercase tracking-wider" style={{ marginBottom: "12px" }}>💰 Order Summary</p>
          <div style={{ fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#666" }}>Subtotal</span>
              <span>SAR {(order.subtotal || order.total || 0).toFixed(2)}</span>
            </div>
            {order.discount > 0 &&
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#666" }}>Discount</span>
                <span>−SAR {order.discount?.toFixed(2)}</span>
              </div>
            }
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#666" }}>Shipping</span>
              <span>{order.shipping_cost > 0 || order.shippingCost > 0 ? `SAR ${(order.shipping_cost || order.shippingCost || 0).toFixed(2)}` : "Free ✅"}</span>
            </div>
            {order.tip > 0 &&
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#666" }}>Tip</span>
                <span>SAR {order.tip.toFixed(2)}</span>
              </div>
            }
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "16px", borderTop: "2px solid #000", marginTop: "12px", paddingTop: "12px" }}>
            <span>TOTAL</span>
            <span className="text-sm">SAR {order.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Gift card purchase note */}
        {giftCardItems.length > 0 &&
        <div className="border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
            <p className="font-bold text-xs uppercase tracking-wider" style={{ marginBottom: "8px" }}>🎁 Gift Card</p>
            <p className="text-xs" style={{ lineHeight: "1.6" }}>Thanks for buying a gift card! Our team will deliver it to you soon.</p>
          </div>
        }

        {/* Notes */}
        {order.notes &&
        <div className="border-b border-dashed border-black" style={{ marginBottom: "24px", paddingBottom: "24px" }}>
            <p className="font-bold text-xs uppercase tracking-wider" style={{ marginBottom: "8px" }}>📝 Notes</p>
            <p className="text-xs" style={{ lineHeight: "1.6" }}>{order.notes}</p>
          </div>
        }

        {/* Footer */}
        <div className="text-center" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
          <p className="font-bold text-base" style={{ marginBottom: "8px" }}>🎉 Thank you!</p>
          <p className="text-xs" style={{ color: "#666", marginBottom: "4px" }}>We appreciate your order.</p>
          <p className="text-xs underline">chipso.db.app</p>
          <p className="text-xs" style={{ color: "#aaa", marginTop: "14px" }}>—— End of Receipt ——</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 print:hidden">
        <Button variant="outline" onClick={handlePrint} className="flex-1 rounded-xl">
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex-1 rounded-xl">
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } body > * { display: none; } #receipt-content { display: block !important; position: fixed; top: 0; left: 0; width: 100%; } }`}</style>
    </div>);

}