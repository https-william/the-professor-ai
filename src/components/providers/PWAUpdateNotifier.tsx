"use client";

import { useEffect } from "react";
import { usePWA } from "@/context/PWAContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { RefreshCw } from "lucide-react";

export default function PWAUpdateNotifier() {
    const { isUpdateAvailable } = usePWA();
    const { addToast } = useToasts();

    useEffect(() => {
        if (isUpdateAvailable) {
            addToast(
                "A new version of The Professor is available. Click here to reload.",
                "info",
                RefreshCw,
                "javascript:window.location.reload()"
            );
        }
    }, [isUpdateAvailable, addToast]);

    return null;
}
