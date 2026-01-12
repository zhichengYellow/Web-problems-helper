package com.ptahelper.hunyuan.console.web.dto;

import jakarta.validation.constraints.NotBlank;

public class ConsoleOptionDto {
    /** e.g. A/B/C/D */
    private String label;

    @NotBlank
    private String text;

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
