import { For, createState } from "ags"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import AstalApps from "gi://AstalApps"
import Graphene from "gi://Graphene"
import app from "ags/gtk4/app"
import { execAsync } from "ags/process"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

export default function Applauncher() {
    let contentbox: Gtk.Box
    let searchentry: Gtk.Entry
    let win: Astal.Window

    const display = Gdk.Display.get_default()
    const clipboard = display.get_clipboard()

    const apps = new AstalApps.Apps()
    const [list, setList] = createState(new Array<AstalApps.Application>())
    const [icon, setIcon] = createState("system-search-symbolic")

    function safeEvalMath(expr: string): string | null {
        try {
            // sadece sayılar, + - * / () ve boşluklara izin veriyoruz
            if (!/^[0-9+\-*/().\s]+$/.test(expr)) return null;

            // Function constructor ile değer döndür
            const result = Function(`"use strict"; return (${expr})`)();
            return result.toString();
        } catch {
            return null;
        }
    }

    function search(text: string) {
        setList(apps.fuzzy_query(text));
        setIcon("system-search-symbolic");

        if (/^[0-9+\-*/().\s]+$/.test(text)) {
            const result = safeEvalMath(text);
            setIcon("accessories-calculator-symbolic");

            if (result !== null) {
                const calcApp: AstalApps.Application = {
                    name: `${text} = ${result}`,
                    iconName: "accessories-calculator-symbolic",
                    launch: () => {
                        clipboard.set(result);
                    },
                } as any;

                setList([calcApp]);
            } else {
                setList([]);
            }
        } else if (text.startsWith(":exec")) {
            setIcon("utilities-terminal-symbolic");
            execAsync("bash -i -c 'compgen -c'")
                .then(out => {
                    const cmds = out.split("\n").filter(Boolean);
                    const matches = cmds
            .filter(c => c.startsWith(text.replace(":exec", "").trim()))
            .slice(0, 100);

            if (matches.length > 0) {
                setList(
                    matches.map(c => ({
                        name: c,
                        iconName: "utilities-terminal-symbolic",
                        launch: () => execAsync([c]).catch(() => {}),
                    }) as any)
                );
            } else {
                // hiç eşleşme yok → direkt yazılan komutu çalıştır seçeneği
                setList([{
                    name: text,
                    iconName: "utilities-terminal-symbolic",
                    launch: () => execAsync(text.replace(":exec", "").trim()),
                }] as any);
            }
                })
        } else if (text.startsWith(":")) {
            setList([{
                name: ":exec",
                iconName: "utilities-terminal-symbolic"
            },{
                name: "gg",
                iconName: "utilities-terminal-symbolic"
            },{
                name: "ddg",
                iconName: "utilities-terminal-symbolic"
            },{
                name: "bs",
                iconName: "utilities-terminal-symbolic"
            }] as any);
        }
    }

    function launch(app?: AstalApps.Application) {
        if (app) {
        win.hide()
        app.launch()
        }
    }

    // close on ESC
    // handle alt + number key
    function onKey(
        _e: Gtk.EventControllerKey,
        keyval: number,
        _: number,
        mod: number,
    ) {
        if (keyval === Gdk.KEY_Escape) {
        win.visible = false
        return
        }
    }

    // close on clickaway
    function onClick(_e: Gtk.GestureClick, _: number, x: number, y: number) {
        const [, rect] = contentbox.compute_bounds(win)
        const position = new Graphene.Point({ x, y })

        if (!rect.contains_point(position)) {
        win.visible = false
        return true
        }
    }

    return (
        <window
        $={(ref) => (win = ref)}
        name="launcher"
        class="Launcher"
        anchor={TOP | BOTTOM | LEFT | RIGHT}
        exclusivity={Astal.Exclusivity.IGNORE}
        application={app}
        keymode={Astal.Keymode.EXCLUSIVE}
        onNotifyVisible={({ visible }) => {
            if (visible) searchentry.grab_focus()
            else searchentry.set_text("")
        }}
        >
        <Gtk.EventControllerKey onKeyPressed={onKey} />
        <Gtk.GestureClick onPressed={onClick} />
        <box
            $={(ref) => (contentbox = ref)}
            class="launcher-content"
            valign={Gtk.Align.CENTER}
            halign={Gtk.Align.CENTER}
            orientation={Gtk.Orientation.VERTICAL}
        >
            <box spacing={3} class={"input"}>
                <image iconName={icon} />
                <entry
                $={(ref) => (searchentry = ref, search(""))}
                onNotifyText={({ text }) => search(text)}
                placeholderText="Type ':' for list of commands"
                hexpand
                valign={Gtk.Align.CENTER}
                />
            </box>
            <Gtk.Separator />
            <scrolledwindow heightRequest={320} class={"apps"}>
                <box spacing={5} orientation={Gtk.Orientation.VERTICAL}>
                    <For each={list}>
                        {(app, index) => (
                        <button onClicked={() => launch(app)}>
                            <box spacing={5}>
                            <image iconName={app.iconName} />
                            <label label={app.name} maxWidthChars={40} wrap />
                            </box>
                        </button>
                        )}
                    </For>
                </box>
            </scrolledwindow>
        </box>
        </window>
    )
}