import { Astal, Gtk, Gdk } from "ags/gtk4"
import app from "ags/gtk4/app"
import Hyprland from "gi://AstalHyprland"
import { For, createBinding } from "ags"
import { getAppIcon } from "../misc/getAppIcon"

function WorkspacesOverview() {
  const hypr = Hyprland.get_default()

  const workspaces = createBinding(hypr, "workspaces")
  const clients = createBinding(hypr, "clients")
  const focused = createBinding(hypr, "focusedWorkspace")

  const SCALE = 0.1

  return (
    <box spacing={10} class="WorkspacesOverview">
      <For each={workspaces.as(wss => {
        const sorted = wss.slice().sort((a, b) => a.id - b.id)

        const ids = sorted.map(ws => ws.id)
        if (ids.includes(6) && !ids.includes(5)) {
          sorted.push({ id: 5, fake: true })
          sorted.sort((a, b) => a.id - b.id)
        }

        return sorted
      })}>
        {(ws: any) => (
          <box
            class={[
              "WorkspaceThumbnail",
              ws.fake || clients.get().filter(c => c.workspace?.id === ws.id).length === 0
                ? "empty"
                : "",
              focused.get()?.id === ws.id ? "focused" : "",
            ].join(" ")}
            valign={Gtk.Align.CENTER}
          >
            <Gtk.Fixed>
              <For each={clients.as(cl => cl.filter(c => c.workspace?.id === ws.id))}>
                {(c: any) => {
                  const x = createBinding(c, "x")
                  const y = createBinding(c, "y")
                  const w = createBinding(c, "width")
                  const h = createBinding(c, "height")

                  return (
                    <button
                      class="WindowMiniature glass"
                      widthRequest={w.as(v => (v ?? 100) * SCALE)}
                      heightRequest={h.as(v => (v ?? 80) * SCALE)}
                      halign={Gtk.Align.START}
                      valign={Gtk.Align.START}
                      onClicked={() => c.focus()}
                      marginStart={x.as(v => (v ?? 0) * SCALE)}
                      marginTop={y.as(v => (v ?? 0) * SCALE)}
                    >
                      <image
                        iconName={getAppIcon(c)}
                        class="WindowIcon"
                        pixelSize={20}
                      />
                    </button>
                  )
                }}
              </For>
            </Gtk.Fixed>
          </box>
        )}
      </For>
    </box>
  )
}

export default function Overview() {
  return (
    <window
      name="overview"
      class="Overview"
      exclusivity={Astal.Exclusivity.IGNORE}
      application={app}
      namespace={"bi-shell-overview"}
    >
      <WorkspacesOverview />
    </window>
  )
}
