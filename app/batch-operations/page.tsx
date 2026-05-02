import BatchOperations from "@/components/batch-operations"
import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"

export default function BatchOperationsPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <main className="min-h-screen flex flex-col antialiased font-sans bg-cover bg-center bg-no-repeat bg-fixed animate-in fade-in duration-700"style={{ 
    backgroundImage: "linear-gradient(rgba(51, 50, 50, 0.53), rgba(51, 50, 50, 0.53)), url('/background.jpg')" }}>
        <Header />
        <Nav />

        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <BatchOperations />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
