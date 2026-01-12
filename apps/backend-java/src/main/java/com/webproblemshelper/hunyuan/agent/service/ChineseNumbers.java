package com.ptahelper.hunyuan.agent.service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class ChineseNumbers {
    private static final Map<String, Integer> MAP = Map.of(
            "一", 1,
            "二", 2,
            "三", 3,
            "四", 4,
            "五", 5,
            "六", 6,
            "七", 7,
            "八", 8,
            "九", 9,
            "十", 10
    );

    private ChineseNumbers() {
    }

    static Integer extractIndex(String content) {
        if (content == null || content.isBlank()) return null;
        Matcher m = Pattern.compile("(?:第)?([一二三四五六七八九十]|[0-9]{1,2})(?:个?选项)?").matcher(content);
        if (!m.find()) return null;
        String token = m.group(1);
        if (token == null) return null;
        if (token.chars().allMatch(Character::isDigit)) {
            try {
                return Integer.parseInt(token);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return MAP.get(token);
    }
}
