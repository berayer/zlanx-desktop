export default function App() {
  const handleClick = () => {
    window.electron.ipcRenderer.send("ping");
  };

  return (
    <div className=" h-svh w-svw flex items-center justify-center select-none flex-col gap-4">
      <h1>Hello world</h1>
      <button
        onClick={handleClick}
        className="border px-2 py-1 rounded-lg shadow-md border-gray-200 cursor-pointer hover:bg-gray-100 active:bg-gray-200"
      >
        click me
      </button>
    </div>
  );
}
