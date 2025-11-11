import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import AstalWp from "gi://AstalWp"
import AstalNetwork from "gi://AstalNetwork"
import Hyprland from "gi://AstalHyprland"
import AstalTray from "gi://AstalTray"
import AstalMpris from "gi://AstalMpris"
import AstalApps from "gi://AstalApps"
import { getAppIcon } from "../misc/getAppIcon"
import { For, With, createBinding, createState } from "ags"
import { createPoll } from "ags/time"
import { execAsync, exec } from "ags/process"
import Pango from "gi://Pango"

// 📂 Dosya seçimi sonrası yapılacak işlem
function setWall(path) {
  if (!path) return
  execAsync(`swww img ${path}`)
  execAsync(`matugen image ${path}`)
}

export default function Settings() {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  const [stack, setStack] = createState("quick")

  return (
    <Gtk.Window
      name="settings"
      class="Settings"
      application={app}
      onCloseRequest={(self) => {
        self.hide()
        return true
      }}
    >
      <box>
        <box vexpand>
          <box class={"stackbar"} vexpand halign={Gtk.Align.START}>
            <button valign={Gtk.Align.START} class={"glass"}>
              <box spacing={10}>
                <image pixelSize={24} iconName={"quicksettings-symbolic"} />
                <label label={"Quick Settings"} />
              </box>
            </button>
          </box>
        </box>

        <stack visibleChildName={stack}>
          <box $type="named" name={"quick"} class={"options"} vexpand hexpand>
            <scrolledwindow vexpand hexpand>
              <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.START}>
                <box>
                  <image pixelSize={24} iconName={"brush-symbolic"} />
                  <label label={"Wallpaper & Colors"} />
                </box>

                {/* 🎯 Dosya seçtiren buton */}
                <button
                  class={"glass"}
                  onClicked={() => {
                    const dialog = new Gtk.FileDialog({
                      title: "Select Wallpaper",
                    });

                    dialog.open(app.active_window, null, (self, result) => {
                        const file = dialog.open_finish(result);
                        if (file) setWall(file.get_path());
                    });
                  }}
                >
                  <box>
                    <image iconName={"wallpaper-symbolic"} pixelSize={24} />
                    <label label={"Choose File"} />
                  </box>
                </button>
              </box>
            </scrolledwindow>
          </box>
        </stack>
      </box>
    </Gtk.Window>
  )
}
