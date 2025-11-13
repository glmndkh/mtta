import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResultsPage } from "./components/results/ResultsPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResultsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
