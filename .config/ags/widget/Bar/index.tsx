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

function Mpris() {
  const mpris = AstalMpris.get_default()
  const apps = new AstalApps.Apps()
  const players = createBinding(mpris, "players")
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }


  return (
    <menubutton>
      <box>
        <image pixelSize={20} iconName={"media-symbolic"} />
      </box>
      <popover css={"margin-top: 10px;"} hasArrow={false}>
        <box spacing={4} orientation={Gtk.Orientation.VERTICAL}>
          <For each={players}>
            {(player) => (
              <box spacing={4} widthRequest={200}>
                <box overflow={Gtk.Overflow.HIDDEN} css="border-radius: 8px;">
                  <image
                    pixelSize={128}
                    file={createBinding(player, "coverArt")}
                    css={"min-height: 128px;"}
                  />
                </box>
                <box vexpand valign={Gtk.Align.CENTER} orientation={Gtk.Orientation.VERTICAL}>
                  <box
                    valign={Gtk.Align.START}
                    orientation={Gtk.Orientation.VERTICAL}
                  >
                    <label xalign={0} ellipsize={Pango.EllipsizeMode.END} maxWidthChars={20} label={createBinding(player, "title")} />
                    <label xalign={0} label={createBinding(player, "artist")} />
                  </box>
                  <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.END}>
                    <box valign={Gtk.Align.END} hexpand>
                      <box halign={Gtk.Align.START} valign={Gtk.Align.START} spacing={5}>
                        <label label={createBinding(player, "position")((pos) => formatTime(pos))} />
                        <label label={"/"} />
                        <label label={createBinding(player, "length")((len) => formatTime(len))} />
                      </box>
                      <button
                        onClicked={() => player.play_pause()}
                        visible={createBinding(player, "canControl")}
                        halign={Gtk.Align.END} valign={Gtk.Align.START}
                      >
                        <box>
                          <image
                            iconName="media-playback-pause-symbolic"
                            visible={createBinding(
                              player,
                              "playbackStatus",
                            )((s) => s === AstalMpris.PlaybackStatus.PLAYING)}
                          />
                          <image
                            iconName="media-playback-start-symbolic"
                            visible={createBinding(
                              player,
                              "playbackStatus",
                            )((s) => s !== AstalMpris.PlaybackStatus.PLAYING)}
                          />
                        </box>
                      </button>
                    </box>
                    <box hexpand halign={Gtk.Align.END}>
                      <button
                        onClicked={() => player.previous()}
                        visible={createBinding(player, "canGoPrevious")}
                      >
                        <image iconName="media-seek-backward-symbolic" />
                      </button>
                      <slider
                        orientation={Gtk.Orientation.HORIZONTAL}
                        hexpand
                        value={createBinding(player, "position")}    // mevcut pozisyon
                        digits={0}
                        widthRequest={200}
                        min={0}
                        max={createBinding(player, "length")}
                        onChangeValue={(s) => {
                          const pos = s.get_value()
                          player.position = pos // Mpris player pozisyonunu güncelle
                        }}
                      />
                      <button
                        onClicked={() => player.next()}
                        visible={createBinding(player, "canGoNext")}
                      >
                        <image iconName="media-seek-forward-symbolic" />
                      </button>
                    </box>
                  </box>
                </box>
              </box>
            )}
          </For>
        </box>
      </popover>
    </menubutton>
  )
}

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

function SidebarButton() {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <button onClicked={() => execAsync("ags toggle sidebar")}>
      <box spacing={3}>
        <With value={wifi}>
          {(wifi) =>
            wifi && (
        <image iconName={createBinding(wifi, "iconName")} />
            )
          }
        </With>
        <image iconName={createBinding(speaker, "volumeIcon")} />
      </box>
    </button>
  )
}

function AudioOutput() {
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <menubutton>
      <image iconName={createBinding(speaker, "volumeIcon")} />
      <popover>
        <box>
          <slider
            widthRequest={260}
            onChangeValue={({ value }) => speaker.set_volume(value)}
            value={createBinding(speaker, "volume")}
          />
        </box>
      </popover>
    </menubutton>
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

  return (
    <button onClicked={() => setBatteryPercentage(!batteryPercentage.get())} visible={createBinding(battery, "isPresent")}>
      <box spacing={2}>
        <image iconName={createBinding(battery, "iconName")} />
        <revealer transitionType={Gtk.RevealerTransitionType.SLIDE_RIGHT} revealChild={batteryPercentage}>
          <label label={percent} />
        </revealer>
        <levelbar orientation={Gtk.Orientation.HORIZONTAL} widthRequest={100} value={createBinding(battery, "percentage",)((p) => p / 100)} />
      </box>
    </button>
  )
}

function Clock({ format = "%H:%M - %A %d." }) {
  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format(format)!
  })

  return (
    <label label={time} />
  )
}

function Dock() {
  const hypr = Hyprland.get_default()
  const apps = new AstalApps.Apps()
  const clients = createBinding(hypr, "clients")

  return (
    <box class="Dock" vexpand spacing={6}>
      <For
        each={clients.as(cs =>
          cs
            .filter(c => !c.address.startsWith("special:"))
            .sort((a, b) => (a.workspace?.id ?? 0) - (b.workspace?.id ?? 0))
        )}
      >
        {(client: any) => {
          // reactive olarak focus kontrol
          const isFocused = createBinding(hypr, "focusedClient").as(
            fc => fc?.address === client.address
          )

          return (
            <button vexpand onClicked={() => client.focus()}>
              <image iconName={getAppIcon(client)} />
            </button>
          )
        }}
      </For>
    </box>
  )
}


function Workspaces() {
  const hypr = Hyprland.get_default()

  // sıralı + boşları doldurulmuş liste
  const viewWorkspaces = createBinding(hypr, "workspaces").as(wss => {
    const isSpecial = (id: number) => id >= -99 && id <= -2
    const count = (ws: any) => (ws?.windows?.length ?? ws?.clients?.length ?? 0)

    const filtered = wss
      .filter(ws => !isSpecial(ws.id))
      .sort((a, b) => a.id - b.id)

    // en son DOLU workspace id'si (hiç dolu yoksa 1)
    const lastUsed = Math.max(1, ...filtered.filter(ws => count(ws) > 0).map(ws => ws.id))

    // 1..lastUsed aralığını üret; eksik olanları "virtual" boş ws olarak ekle
    const ids = Array.from({ length: lastUsed }, (_, i) => i + 1)
    return ids.map(id => filtered.find(ws => ws.id === id) ?? { id, windows: [], __virtual: true })
  })

  const isEmpty = (ws: any) => (ws?.windows?.length ?? ws?.clients?.length ?? 0) === 0

  return (
    <togglebutton onToggled={() => execAsync("ags toggle overview")} class="Workspaces">
      <box>
        <For each={viewWorkspaces}>
          {(ws: any) => (
            <button
              halign={Gtk.Align.CENTER}
              class={createBinding(hypr, "focusedWorkspace").as(fw => {
                const cls: string[] = []
                if (fw?.id === ws.id) cls.push("focused")
                if (isEmpty(ws)) cls.push("empty")
                return cls.join(" ")
              })}
              valign={Gtk.Align.CENTER}
              onClicked={() => {
                if (typeof ws.focus === "function") ws.focus()
                else if (typeof hypr.dispatch === "function") hypr.dispatch("workspace", String(ws.id))
                else if (typeof hypr.focusWorkspace === "function") hypr.focusWorkspace(ws.id)
              }}>
            </button>
          )}
        </For>
      </box>
    </togglebutton>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      class="Bar"
      namespace={"bi-shell"}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox>
        <box $type="start">
          <button onClicked={() => execAsync("ags toggle launcher")}><box><image iconName={"system-search-symbolic"} /><label label={"Applications"} /></box></button>
          <Mpris />
          <Workspaces />
          <Dock />
        </box>
        <box $type="center">
          <Clock />
        </box>
        <box $type="end">
          <Tray />
          <SidebarButton />
          <Battery />
          <button onClicked={() => execAsync("ags toggle power")}><image css={"color: #F96793;"} iconName={"system-shutdown-symbolic"} /></button>
        </box>
      </centerbox>
    </window>
  )
} 