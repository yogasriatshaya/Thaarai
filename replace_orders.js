const fs = require('fs');
const path = "c:\\Users\\ADMIN\\Thaarai-Ecommerce-UI\\frontend\\src\\pages\\Orders.jsx";
let content = fs.readFileSync(path, 'utf8');

const search = `<p className="text-xs text-gray-500 mt-1 leading-relaxed">{statusInfo.sub}</p>`;
const addCount = `<p className="text-xs text-gray-500 mt-1 leading-relaxed">{statusInfo.sub}</p>
                            {order.trackingId && (
                                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-0.5">
                                   <p className="text-[11px] font-bold text-black flex items-center gap-1">📦 Tracking</p>
                                   <p className="text-[11px] font-bold text-[#2874f0] font-sans">{order.carrierName} ({order.trackingId})</p>
                                </div>
                            )}`;

if (content.includes(search)) {
    content = content.replace(search, addCount);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Applied tracking successfully!");
} else {
    console.log("Pattern not matched!");
}
