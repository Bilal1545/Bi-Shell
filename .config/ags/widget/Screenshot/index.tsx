import app from "ags/gtk4/app"
import Gdk from "gi://Gdk?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Astal from "gi://Astal?version=4.0"
import GLib from "gi://GLib"
import { execAsync } from "ags/process"

export default function Screenshot(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

    let startX = 0
    let startY = 0
    let endX = 0
    let endY = 0
    let selecting = false

    function reset() {
        startX = 0
        startY = 0
        endX = 0
        endY = 0
        selecting = false
    }

    const overlay = new Gtk.Overlay()
    const area = new Gtk.DrawingArea()
    area.set_draw_func((widget, cr) => {
        if (selecting || (endX && endY)) {
            const x = Math.min(startX, endX)
            const y = Math.min(startY, endY)
            const w = Math.abs(endX - startX)
            const h = Math.abs(endY - startY)
            cr.setSourceRGBA(1.0, 1.0, 1.0, 0.2)
            cr.rectangle(x, y, w, h)
            cr.fill()
            cr.setSourceRGBA(1.0, 1.0, 1.0, 0.3)
            cr.setLineWidth(2)
            cr.rectangle(x, y, w, h)
            cr.stroke()
        }
    })

    overlay.set_child(area)

    const window = (
        <window
            name="screenshot"
            class="Screenshot"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={TOP | BOTTOM | LEFT | RIGHT}
            application={app}
            keymode={Astal.Keymode.ON_DEMAND}
            onShow={() => reset()}
        >
            {overlay}
            <Gtk.EventControllerKey
                onKeyPressed={({ widget }, keyval: number) => {
                    if (keyval === Gdk.KEY_Escape) {
                        widget.hide()
                    } else if (keyval === Gdk.KEY_Return) {
                        if (endX && endY) {
                            takeShot(false)
                        }
                    }
                }}
            />
            <Gtk.GestureClick
                onPressed={(controller, n, x, y) => {
                    startX = x
                    startY = y
                    selecting = true
                }}
                onReleased={(controller, n, x, y) => {
                    endX = x
                    endY = y
                    selecting = false
                    takeShot(false)
                }}
            />
            <Gtk.EventControllerMotion
                onMotion={(controller, x, y) => {
                    if (selecting) {
                        endX = x
                        endY = y
                        area.queue_draw()
                    }
                }}
            />
        </window>
    )

    async function takeShot(full: boolean) {
        // Widget'i hemen kapat
        window.hide()

        // 1 saniye bekleme
        await new Promise(r => GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => (r(true), GLib.SOURCE_REMOVE)))

        // Koordinatları tam sayı yap
        let x = Math.round(Math.min(startX, endX))
        let y = Math.round(Math.min(startY, endY))
        let w = Math.round(Math.abs(endX - startX))
        let h = Math.round(Math.abs(endY - startY))

        try {
            // Kullanıcı dilinden bağımsız Pictures dizini
            const picturesDir = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES)
            const screenshotsDir = `${picturesDir}/Screenshots`
            await execAsync(`mkdir -p "${screenshotsDir}"`)

            // Dosya adı
            const file = `${screenshotsDir}/screenshot_${Date.now()}.png`

            await execAsync(`grim -g "${x},${y} ${w}x${h}" "${file}"`)
            
            await execAsync(`sh -c 'wl-copy -t image/png < "${file}"'`)

            print(`Screenshot saved: ${file}`)

        } catch (err) {
            print(`Screenshot failed: ${err}`)
        }
    }

    return window
}
