import './globals.css'

export const metadata = {
  title: 'Expedientes Odontológicos',
  description: 'Sistema de manejo de expedientes para clínica dental',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}