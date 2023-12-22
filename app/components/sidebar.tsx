import { useEffect, useRef, useMemo } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import DragIcon from "../icons/drag.svg";
import MagicGptIcon from "../icons/magic-gpt.svg";
import Locale from "../locales";
import { useLocation } from "react-router-dom";

import { useAppConfig, useChatStore } from "../store";
import { SidebarNav } from "./sidebar-nav";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
} from "../constant";

import { useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { Mask } from "../store/mask";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = MIN_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? MIN_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;

    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

  const location = useLocation();
  const isChat =
    location.pathname === Path.Chat || location.pathname == Path.Home;

  useHotKey();

  const startChat = (mask?: Mask) => {
    setTimeout(() => {
      chatStore.newSession(mask);
      navigate(Path.Chat);
    }, 10);
  };

  return (
    <div
      className={`${styles.sidebar} ${props.className}`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {!isMobileScreen && <SidebarNav />}
      {isChat && (
        <div
          className={`${styles["sidebar-right"]} ${
            shouldNarrow && styles["narrow-sidebar"]
          }`}
        >
          <div
            className={`${styles["sidebar-header"]} ${styles["sidebar-bg"]}`}
            data-tauri-drag-region
          >
            {isMobileScreen && (
              <div className={styles["sidebar-title-left"]}>
                <div className={styles["sidebar-logo"] + " no-dark"}>
                  <div
                    className={styles["user-avatar"] + " no-dark"}
                    style={{
                      height: "45px",
                      minHeight: "45px",
                      width: "45px",
                      minWidth: "45px",
                    }}
                  >
                    <MagicGptIcon
                      className={styles["icon"]}
                      width="30px"
                      height="30px"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className={styles["sidebar-title-right"]}>
              <div className={styles["sidebar-title"]} data-tauri-drag-region>
                {Locale.Home.Title}
              </div>
              <div className={`${styles["sidebar-sub-title"]}`}>
                {Locale.Home.Slogn}
              </div>
              <div className={`${styles["sidebar-toolbar"]} `}>
                {isMobileScreen && (
                  <IconButton
                    className={styles["sidebar-bar-button"]}
                    onClick={() => {
                      navigate(Path.Settings, { state: { fromHome: true } });
                    }}
                    icon={
                      <i
                        className="iconfont icon-shezhi1"
                        style={{ fontSize: "14px" }}
                      ></i>
                    }
                    shadow
                  />
                )}
                {!isMobileScreen && (
                  <IconButton
                    icon={<i className="iconfont icon-xinzeng"></i>}
                    onClick={() => {
                      if (config.dontShowMaskSplashScreen) {
                        chatStore.newSession();
                        navigate(Path.Chat);
                      } else {
                        startChat();
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div
            className={styles["sidebar-body"]}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                navigate(Path.Home);
              }
            }}
          >
            <ChatList narrow={shouldNarrow} />
          </div>
        </div>
      )}
      {isMobileScreen && (
        <div className={styles["sidebar-tail"]}>
          <SidebarNav />
        </div>
      )}
      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>
    </div>
  );
}
