import wingmanLogo from '/wingman.png'
import './App.css'

function App() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-8">
        <a href="https://camtheperson.com/wingman/" target="_blank">
          <img src={wingmanLogo} className="logo wingman mx-auto" alt="Wingman" />
        </a>
      </div>
      <h2 className="text-3xl font-bold text-wingman-purple mb-4">Coming soon...</h2>
    </div>
  )
}

export default App
