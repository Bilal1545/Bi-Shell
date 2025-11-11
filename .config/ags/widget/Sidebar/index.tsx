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
import { For, With, createBinding, createState } from "ags"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"
import NotificationCenter from "./NotificationsMenu"
import Pango from "gi://Pango"

function Tray() {
  const tray = AstalTray.get_default()
  const items = createBinding(tray, "items")

  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel
    btn.insert_action_group("dbusmenu", item.actionGroup)
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup)
    })
  }

  return (
    <box>
      <For each={items}>
        {(item) => (
          <menubutton $={(self) => init(self, item)}>
            <image gicon={createBinding(item, "gicon")} />
          </menubutton>
        )}
      </For>
    </box>
  )
}

function AudioSlider() {
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <box>
      <image iconName={createBinding(speaker, "volumeIcon")} />
      <slider
        widthRequest={260}
        onChangeValue={({ value }) => speaker.set_volume(value)}
        value={createBinding(speaker, "volume")}
        hexpand
        class={"slider"}
      />
    </box>
  )
}

function Battery() {
  const battery = AstalBattery.get_default()
  const powerprofiles = AstalPowerProfiles.get_default()
  const [batteryPercentage, setBatteryPercentage] = createState(false)

  const percent = createBinding(
    battery,
    "percentage",
  )((p) => `${Math.floor(p * 100)}%`)

  const setProfile = (profile: string) => {
    powerprofiles.set_active_profile(profile)
  }

  return (
    <menubutton visible={createBinding(battery, "isPresent")}>
      <box spacing={1}>
        <image iconName={createBinding(battery, "iconName")} />
        <label label={percent} visible={createBinding(batteryPercentage)} />
        <levelbar orientation={Gtk.Orientation.HORIZONTAL} widthRequest={100} value={createBinding(battery, "percentage",)((p) => p / 100)} />
      </box>
      <popover>
        <box orientation={Gtk.Orientation.VERTICAL}>
          {powerprofiles.get_profiles().map(({ profile }) => (
            <button onClicked={() => setProfile(profile)}>
              <label label={profile} xalign={0} />
            </button>
          ))}
        </box>
      </popover>
    </menubutton>
  )
}

function Time({ format = "%H:%M" }) {
  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format(format)!
  })

  return (
      <label label={time} />
  )
}

function PowerProfiles() {
  const battery = AstalBattery.get_default()
  const powerprofiles = AstalPowerProfiles.get_default()
  if (createBinding(battery, "isPresent").get()) {
    return (
      <menubutton
        class={"glass"}
        hexpand
        alwaysShowArrow
      >
        <box halign={Gtk.Align.START} hexpand spacing={5}>
          <image iconName={`power-profile-${createBinding(powerprofiles, "active_profile").get()}-symbolic`} />
          <label label={createBinding(powerprofiles, "active_profile")} />
        </box>
        <popover>
          <box spacing={3} orientation={Gtk.Orientation.VERTICAL}>
            {powerprofiles.get_profiles().map(({ profile }) => (
              <button onClicked={() => setProfile(profile)}>
                <box spacing={3}>
                  <image iconName={`power-profile-${profile}-symbolic`} />
                  <label label={profile} xalign={0} />
                </box>
              </button>
            ))}
          </box>
        </popover>
      </menubutton>
    )
  }
  
}

const [wifiReveal, setWifiReveal] = createState(false)

function Revealers() {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")
  const sorted = (arr: Array<AstalNetwork.AccessPoint>) => {
    return arr.filter((ap) => !!ap.ssid).sort((a, b) => b.strength - a.strength)
  }

  async function connect(ap: AstalNetwork.AccessPoint) {
    // connecting to ap is not yet supported
    // https://github.com/Aylur/astal/pull/13
    try {
      await execAsync(`nmcli d wifi connect ${ap.bssid}`)
    } catch (error) {
      // you can implement a popup asking for password here
      console.error(error)
    }
  }

  return (
    <revealer revealChild={wifiReveal}>
      <With value={wifi}>
        {(wifi) =>
          wifi && (
      <box class={"group"} orientation={Gtk.Orientation.VERTICAL}>
        <box class={"title"} halign={Gtk.Align.START} hexpand spacing={5}>
          <image iconName={createBinding(wifi, "iconName")} />
          <label label="Wifi" />
        </box>
        <Gtk.Separator />
        <box orientation={Gtk.Orientation.VERTICAL} spacing={3}>
          <For each={createBinding(wifi, "accessPoints")(sorted)}>
            {(ap: AstalNetwork.AccessPoint) => (
              <button onClicked={() => connect(ap)}>
                <box spacing={4}>
                  <image iconName={createBinding(ap, "iconName")} />
                  <label label={createBinding(ap, "ssid")} />
                  <image
                    iconName="object-select-symbolic"
                    visible={createBinding(
                      wifi,
                      "activeAccessPoint",
                    )((active) => active === ap)}
                  />
                </box>
              </button>
            )}
          </For>
        </box>
      </box>
      )}
      </With>
    </revealer>
  )
}

export default function Sidebar(gdkmonitor: Gdk.Monitor) {
  const { TOP, BOTTOM, RIGHT } = Astal.WindowAnchor
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")
  const battery = AstalBattery.get_default()
  const powerprofiles = AstalPowerProfiles.get_default()
  const percent = createBinding(
    battery,
    "percentage",
  )((p) => `${Math.floor(p * 100)}%`)
  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format(format)!
  })

  const setProfile = (profile: string) => {
    powerprofiles.set_active_profile(profile)
  }
  
  return (
    <window
      visible={false}
      name="sidebar"
      class={"Sidebar"}
      namespace={"bi-shell-sidebar"}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.NORMAL}
      anchor={TOP | BOTTOM | RIGHT}
      application={app}
    >
        <box spacing={10} orientation={Gtk.Orientation.VERTICAL}>
          <box valign={Gtk.Align.CENTER} class={"top-menu"} hexpand>
            <image iconName={"bi-shell"} pixelSize={100} />
            <box valign={Gtk.Align.CENTER} orientation={Gtk.Orientation.VERTICAL}>
              <box spacing={2} visible={createBinding(battery, "isPresent")}>
                <image iconName={createBinding(battery, "iconName")} />
                <label label={percent} />
              </box>
              <box spacing={2}>
                <image iconName={"org.gnome.Settings-time-symbolic"} />
                <Time />
              </box>
            </box>
            <box spacing={10} valign={Gtk.Align.CENTER} hexpand halign={Gtk.Align.END}>
              <button onClicked={() => (execAsync("ags toggle settings"), execAsync("ags toggle sidebar"))} class={"glass"}><image iconName={"applications-system-symbolic"} pixelSize={20} /></button>
              <button onClicked={() => execAsync("hyprctl dispatch exit")} class={"glass"}><image iconName={"application-exit-symbolic"} pixelSize={20} /></button>
              <button onClicked={() => execAsync("ags toggle power")} class={"glass"}><image iconName={"system-shutdown-symbolic"} pixelSize={20} /></button>
            </box>
          </box>
          <box spacing={5} orientation={Gtk.Orientation.VERTICAL} class={"content"}>
            <box orientation={Gtk.Orientation.VERTICAL} hexpand>
              <AudioSlider />
            </box>
            <box spacing={10} hexpand class={"group"}>
                <With value={wifi}>
                  {(wifi) =>
                    wifi && (
                <box class={"controlbutton"}>
                  <button
                    class={createBinding(wifi, "activeAccessPoint").as((active) =>
                      active ? "glass active" : "glass"
                    )}
                    halign={Gtk.Align.END}
                    onClicked={() => setWifiReveal(!wifiReveal.get())}
                  >
                    <image pixelSize={18} iconName={createBinding(wifi, "iconName")} />
                  </button>
                  <box orientation={Gtk.Orientation.VERTICAL}>
                    <label halign={Gtk.Align.START} label="Internet" />
                    <label halign={Gtk.Align.START} class={"description"} label={createBinding(wifi, "activeAccessPoint").as(ap => ap ? ap.ssid : "not connected")}/>
                  </box>
                </box>
                
                )}
                </With>
                <With value={wifi}>
                  {(wifi) =>
                    wifi && (
                <box class={"controlbutton"}>
                  <button
                    class={createBinding(wifi, "activeAccessPoint").as((active) =>
                      active ? "glass active" : "glass"
                    )}
                    halign={Gtk.Align.END}
                    onClicked={() => setWifiReveal(!wifiReveal.get())}
                  >
                    <image pixelSize={18} iconName={createBinding(wifi, "iconName")} />
                  </button>
                  <box orientation={Gtk.Orientation.VERTICAL}>
                    <label halign={Gtk.Align.START} label="Internet" />
                    <label halign={Gtk.Align.START} class={"description"} label={createBinding(wifi, "activeAccessPoint").as(ap => ap ? ap.ssid : "not connected")}/>
                  </box>
                </box>
                
                )}
                </With>
                <PowerProfiles />
            </box>
            <Revealers />
            <NotificationCenter />
          </box>
        </box>
    </window>
  )
}