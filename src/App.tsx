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
      <h2 className="text-3xl font-bold text-wingman-purple mb-6">The best map for Portland Wing Week.</h2>
      <ul className="text-xl md:text-2xl list-disc mt-4 *:mb-3 mb-12 px-2">
        <li>Find the best wings in Portland</li>
        <li>Favorite and rate wings with your friends</li>
        <li>Filter by neighborhood, what's open now, and more</li>
        <li>Get directions to your next wing adventure</li>
      </ul>
      <h2 className="text-3xl font-bold text-wingman-purple">Coming soon...</h2>
    </div>
  )
}

export default App
