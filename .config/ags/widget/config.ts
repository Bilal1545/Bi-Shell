import { readFile } from "ags/file"
import { createState } from "ags"
import GLib from "gi://GLib"
import AstalMpris from "gi://AstalMpris"

const CONFIG_PATH = `${GLib.get_home_dir()}/.config/bi-shell/config.json`

export const [ configState, setConfigState ] = createState({ bar: false })

function loadConfig() {
    try {
        const data = readFile(CONFIG_PATH, "utf-8")
        const json = JSON.parse(data)
        setConfigState(json) // mevcut state’i güncelle
        console.log(configState.get())
    } catch (e) {
        print(`Config okunamadı: ${e}`)
    }
}

// yükle
loadConfig()
