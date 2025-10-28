import app from "ags/gtk4/app"
import style from "./style.scss"
import Sidebar from "./widget/Sidebar"
import Bar from "./widget/Bar"
import Settings from "./widget/Settings"
import Applauncher from "./widget/Applauncher"
import Power from "./widget/Power"
import Notifications from "./widget/Notifications"
import Overview from "./widget/Overview"
import Screenshot from "./widget/Screenshot"

app.start({
  requestHandler(request: string, res: (response: any) => void) {
    if (request == "say hi") {
      
    }
    res("unknown command")
  },
  css: style,
  icons: `./icons`,
  main() {
    app.get_monitors().map(Bar)
    app.get_monitors().map(Sidebar)
    app.get_monitors().map(Applauncher)
    app.get_monitors().map(Notifications)
    app.get_monitors().map(Screenshot)
    app.get_monitors().map(Power)
    app.get_monitors().map(Overview)
    app.get_monitors().map(Settings)
  },
})
