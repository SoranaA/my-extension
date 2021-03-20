/*global chrome*/

function App() {
  const onClick = () => {
    console.log("clicked")
    chrome.runtime.sendMessage("Hello from the popup!");
  };

  return (
    <div>
      <p>Hello World</p>
      <button className="snowButton" onClick={onClick}>
        Click me
      </button>
    </div>
  );
}

export default App;
