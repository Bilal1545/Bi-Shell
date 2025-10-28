import { Gtk } from "ags/gtk4"
import AstalNotifd from "gi://AstalNotifd"
import Notification from "./Notification"
import { createBinding, For, createState, onCleanup } from "ags"

export default function NotificationCenter() {
  const notifd = AstalNotifd.get_default()

  const [notifications, setNotifications] = createState<AstalNotifd.Notification[]>([])

  const notifiedHandler = notifd.connect("notified", (_, id) => {
    const n = notifd.get_notification(id)
    if (!n) return

    // GObject yerine sadece gerekli property'leri kopyalıyoruz
    const clone = {
      id: n.id,
      appName: n.appName,
      appIcon: n.appIcon,
      body: n.body,
      summary: n.summary,
      image: n.image,
      desktopEntry: n.desktopEntry,
      actions: n.actions,
      time: n.time,
      urgency: n.urgency,
    }

    setNotifications((ns) => [clone, ...ns])
  })

  onCleanup(() => {
    notifd.disconnect(notifiedHandler)
  })

  return (
    <box class={"NotificationCenter group"} vexpand hexpand orientation={Gtk.Orientation.VERTICAL}>
      <scrolledwindow minContentHeight={300} vexpand hexpand>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
          <For each={notifications}>
            {(n) => (
              <Notification
                notification={n}
                onClose={() => setNotifications(ns => ns.filter(x => x.id !== n.id))}
              />
            )}
          </For>
        </box>
      </scrolledwindow>

      <box valign={Gtk.Align.END}>
        <button
          class={"glass"}
          onClicked={() => setNotifications([])}
        >
          <box>
            <image iconName={"edit-clear-symbolic"} />
            <label label={"Clear"} />
          </box>
        </button>
      </box>
    </box>
  )
}
