import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Uygulama genelinde tek bir güvenlik ağı: 15 feature bileşeninden herhangi biri (veya
// AppShell'in geri kalanı) render sırasında beklenmeyen bir hata fırlatırsa, kullanıcı boş
// bir beyaz ekran yerine anlaşılır bir mesaj görür. Bu, mevcut happy-path davranışını
// DEĞİŞTİRMEZ — sadece bir hata durumunda devreye girer.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Prod'da kullanıcıya ham stack trace göstermiyoruz; geliştirici için sadece konsola yazıyoruz.
    if ((import.meta as any).env?.DEV) {
      console.error("ErrorBoundary caught:", error, info.componentStack);
    }
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <h1 className="text-lg font-bold text-gray-900 mb-2">Bir şeyler ters gitti</h1>
            <p className="text-sm text-gray-500 mb-5">
              Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin; sorun devam ederse lütfen destek ile iletişime geçin.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-gray-900 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-gray-800 transition"
            >
              Sayfayı Yenile
            </button>
            {(import.meta as any).env?.DEV && (
              <pre className="mt-4 text-left text-[10px] text-red-500 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
