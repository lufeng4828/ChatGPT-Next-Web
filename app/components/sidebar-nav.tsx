import styles from "./home.module.scss";

import { IconButton } from "./button";
import MagicGptIcon from "../icons/magic-gpt.svg";
import Locale from "../locales";
import { useAppConfig, useChatStore } from "../store";
import { useLocation } from "react-router-dom";
import { Path, REPO_URL } from "../constant";
import { showToast } from "./ui-lib";
import { useNavigate } from "react-router-dom";
import { useMobileScreen } from "../utils";
import { Mask } from "../store/mask";

export function SidebarNav() {
  const config = useAppConfig();
  const location = useLocation();
  const isMobileScreen = useMobileScreen();
  const isChat =
    location.pathname === Path.Chat || location.pathname == Path.Home;
  const isNewChat =
    location.pathname === Path.NewChat || location.pathname == Path.Masks;
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const startChat = (mask?: Mask) => {
    setTimeout(() => {
      chatStore.newSession(mask);
      navigate(Path.Chat);
    }, 10);
  };

  return (
    <div
      className={`${
        isMobileScreen ? styles["sidebar-bottom"] : styles["sidebar-left"]
      }`}
    >
      {!isMobileScreen && (
        <div className={styles["sidebar-logo"] + " no-dark"}>
          <div
            className="user-avatar no-dark"
            style={{
              height: "45px",
              minHeight: "45px",
              width: "45px",
              minWidth: "45px",
              background: getComputedStyle(
                document.documentElement,
              ).getPropertyValue("--primary-color"),
            }}
          >
            <MagicGptIcon
              className={styles["icon"]}
              width="30px"
              height="30px"
            />
          </div>
        </div>
      )}
      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={
            <i
              className="iconfont icon-xiaoxi"
              style={{ fontSize: "24px" }}
            ></i>
          }
          text={isMobileScreen ? undefined : Locale.Chat.Name}
          className={`${styles["sidebar-bar-button"]} ${
            isChat ? styles["sidebar-active"] : ""
          }`}
          onClick={() => {
            if (config.dontShowMaskSplashScreen !== true) {
              navigate(Path.Chat, { state: { fromHome: true } });
            } else {
              navigate(Path.Masks, { state: { fromHome: true } });
            }
          }}
          shadow
        />
        <IconButton
          icon={
            <i
              className="iconfont icon-GPTBOTS"
              style={{ fontSize: "24px" }}
            ></i>
          }
          text={isMobileScreen ? undefined : Locale.Mask.Name}
          className={`${styles["sidebar-bar-button"]} ${
            isNewChat ? styles["sidebar-active"] : ""
          }`}
          onClick={() => {
            if (config.dontShowMaskSplashScreen !== true) {
              navigate(Path.NewChat, { state: { fromHome: true } });
            } else {
              navigate(Path.Masks, { state: { fromHome: true } });
            }
          }}
          shadow
        />
        {isMobileScreen && (
          <div
            className="user-avatar no-dark"
            style={{
              height: "45px",
              minHeight: "45px",
              width: "45px",
              minWidth: "45px",
              background: getComputedStyle(
                document.documentElement,
              ).getPropertyValue("--primary-color"),
            }}
          >
            <i
              onClick={() => {
                if (config.dontShowMaskSplashScreen) {
                  chatStore.newSession();
                  navigate(Path.Chat);
                } else {
                  startChat();
                }
              }}
              className="iconfont icon-xinzeng"
              style={{ fontSize: "24px", color: "#fff" }}
            ></i>
          </div>
        )}
        <IconButton
          icon={
            <i
              className="iconfont icon-plugin"
              style={{ fontSize: "24px" }}
            ></i>
          }
          text={isMobileScreen ? undefined : Locale.Plugin.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => navigate(Path.Plugins, { state: { fromHome: true } })}
          shadow
        />
        {!isMobileScreen && (
          <IconButton
            className={styles["sidebar-bar-button"]}
            onClick={() => {
              navigate(Path.Settings, { state: { fromHome: true } });
            }}
            icon={
              <i
                className="iconfont icon-shezhi1"
                style={{ fontSize: "24px" }}
              ></i>
            }
            shadow
          />
        )}
        {isMobileScreen && (
          <IconButton
            className={styles["sidebar-bar-button"]}
            onClick={() => {
              window.open(REPO_URL, "_blank");
            }}
            icon={
              <i
                className="iconfont icon-github"
                style={{ fontSize: "24px" }}
              ></i>
            }
            shadow
          />
        )}
      </div>
      {!isMobileScreen && (
        <div className={styles["sidebar-footer-bar"]}>
          <div className={styles["sidebar-action"]}>
            <IconButton
              className={styles["sidebar-bar-button"]}
              onClick={() => {
                navigate(Path.Settings, { state: { fromHome: true } });
              }}
              icon={
                <i
                  className="iconfont icon-shezhi1"
                  style={{ fontSize: "18px" }}
                ></i>
              }
              shadow
            />
          </div>
          <div className={styles["sidebar-action"]}>
            <IconButton
              className={styles["sidebar-bar-button"]}
              onClick={() => {
                window.open(REPO_URL, "_blank");
              }}
              icon={
                <i
                  className="iconfont icon-github"
                  style={{ fontSize: "18px" }}
                ></i>
              }
              shadow
            />
          </div>
        </div>
      )}
    </div>
  );
}
