import Sidebar from './Sidebar';

export default function Layout({ children, title }) {
  return (
    <div className="flex min-h-screen" style={{ zoom: '0.9' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <h1 className="font-serif text-xl text-charcoal">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
              <span className="text-gold-700 text-xs font-serif font-medium">A</span>
            </div>
            <span className="text-xs text-gray-500 font-sans">Admin</span>
          </div>
        </header>
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
