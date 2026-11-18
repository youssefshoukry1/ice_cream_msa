import "./globals.css";

export const metadata = {
  title: "Löffelwerk · Eis im Becher",
  description: "Entdecke die vier Eissorten der Löffelwerk Designvorschau.",
};

export default function RootLayout({ children }) {
  return <html lang="de"><body>{children}</body></html>;
}
