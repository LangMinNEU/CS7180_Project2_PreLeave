import { AuthPage } from './components/AuthPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-blue-600 mb-6 drop-shadow-sm">
          PreLeave Transit
        </h1>
      </div>
      <AuthPage />
    </div>
  )
}

export default App
