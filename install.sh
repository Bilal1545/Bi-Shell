#!/bin/bash

# Terminal color codes
green="\e[32m"
red="\e[31m"
yellow="\e[33m"
reset="\e[0m"

clear
cat << "EOF"
 ____  _      ____  _          _ _   ___           _        _ _ 
| __ )(_)    / ___|| |__   ___| | | |_ _|_ __  ___| |_ __ _| | |
|  _ \| |____\___ \| '_ \ / _ \ | |  | || '_ \/ __| __/ _` | | |
| |_) | |_____|__) | | | |  __/ | |  | || | | \__ \ || (_| | | |
|____/|_|    |____/|_| |_|\___|_|_| |___|_| |_|___/\__\__,_|_|_|
EOF
echo By Adnan Bilal ACAR
echo

# Ask for sudo password upfront
if ! sudo -v 2>/dev/null; then
    echo -e "${red}Cannot get sudo access. Exiting.${reset}"
    exit 1
fi

# Keep sudo alive for the duration of the script (silent)
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

# Install confirmation
while true; do
    read -p "Do you want to install Bi-Shell dependencies? (Yy/Nn) (Default: Y): " install_answer

    if [[ "$install_answer" == "y" || "$install_answer" == "Y" || "$install_answer" == "" ]]; then
        echo -e "${green}Installing dependencies...${reset}"
        yay -S --noconfirm swww ags cliphist wl-clipboard hyprland matugen
        break
    elif [[ "$install_answer" == "n" || "$install_answer" == "N" ]]; then
        echo -e "${yellow}Dependency installation skipped...${reset}"
        break
    else
        echo -e "${red}Unavailable answer. Please retry.${reset}"
    fi
done

tmpdir=$(mktemp -d -t bi-shell-XXXX)
git clone https://github.com/Bilal1545/BilalDot.git "$tmpdir"
cd "$tmpdir"

# Ask for backup
if [ -d "$HOME/.config" ]; then
    read -p "Do you want to backup your current .config directory? (Yy/Nn) (Default: Y): " backup_answer
    if [[ "$backup_answer" == "y" || "$backup_answer" == "Y" || "$backup_answer" == "" ]]; then
        backup_dir="$HOME/.config_backup_$(date +%Y%m%d_%H%M%S)"
        echo -e "${green}Backing up current .config to $backup_dir ...${reset}"
        cp -r "$HOME/.config" "$backup_dir"
    fi
fi

# Merge new dotfiles without deleting existing configs
echo -e "${green}Installing dotfiles into ~/.config ...${reset}"
mkdir -p "$HOME/.config"
rsync -a --ignore-existing .config/ "$HOME/.config/"

echo -e "${green}Installing the shell...${reset}"
# Buraya shell kurulumu ekle

cd ~
rm -rf "$tmpdir"

echo -e "${green}Installation completed.${reset}"
