const fs = require('fs');
const path = "c:\\Users\\ADMIN\\Thaarai-Ecommerce-UI\\admin\\src\\pages\\Orders.jsx";
let txt = fs.readFileSync(path, 'utf8');

// Using regex that tolerates exact line structures
const searchRegex = /\{(\s*)\/\*(\s*)Tracking updates(\s*)\*\/(\s*)\}\s*<div className="mt-4 border-t border-gray-100 pt-3 space-y-2">([\s\S]*?)<\/div>([\s\S]*?)<\/div>([\s\S]*?)<\/div>/i;

const replacement = `{/* Tracking updates */}
                            <div className="mt-4 border-t border-gray-100 pt-3 space-y-2">
                                <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8b7fc0]">Logistics & Tracking</h4>
                                <div className="flex gap-2 text-xs">
                                     <input id={\`carrier-\${order._id}\`} type="text" placeholder="Carrier (e.g. DHL)" defaultValue={order.carrierName} className="border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gold-500 font-sans text-[11px] flex-1" />
                                     <input id={\`tracking-\${order._id}\`} type="text" placeholder="Tracking ID" defaultValue={order.trackingId} className="border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gold-500 font-sans text-[11px] flex-1" />
                                     <button type="button" onClick={() => handleUpdateLogistics(order._id)} className="bg-gold-600 hover:bg-gold-700 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded shadow-sm transition-colors cursor-pointer">Update</button>
                                </div>
                            </div>`;

if (txt.includes('Tracking updates')) {
    // Standard substring replace to prevent regex failure over \r\n
    const searchPart = txt.substring(txt.indexOf('{/* Tracking updates */}'), txt.indexOf('</div>\r\n                            </div>\r\n                            </div>\r\n                           </div>'));
    // safer: find indices
    const start = txt.indexOf('{/* Tracking updates */}');
    const end = txt.indexOf('</div>', txt.indexOf('<div className="grid grid-cols-2 gap-2 text-xs">')) + 6; // closes row div
    const blockEnd = txt.indexOf('</div>', end) + 6; // closes tracking div
    
    txt = txt.substring(0, start) + replacement + txt.substring(blockEnd);
    fs.writeFileSync(path, txt, 'utf8');
    console.log("Replaced successfully!");
} else {
    console.log("Could not find trigger placeholder");
}
