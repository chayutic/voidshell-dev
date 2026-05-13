import Grid from "./components/Grid/Grid";
import Search from "./components/Search/Search";
import WidgetLayer from "./components/Widgets/WidgetLayer";

export default function App() {
  return (
    <div className="voidshell-root">
      <WidgetLayer />
      <Grid />
      <Search />
    </div>
  );
}
