package com.ptahelper.hunyuan.console.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pta.console")
public class ConsoleProperties {
    /**
     * Data directory for persisting console state (question bank, wrong stats, analytics).
     * Defaults to ./data (relative to process working directory).
     */
    private String dataDir = "./data";

    public String getDataDir() {
        return dataDir;
    }

    public void setDataDir(String dataDir) {
        this.dataDir = dataDir;
    }
}
