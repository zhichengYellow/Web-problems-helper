package com.ptahelper.hunyuan.agent.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class Regexes {
    private Regexes() {
    }

    // 常用正则：预编译，避免反复 Pattern.compile
    static final Pattern CHOICE_LETTERS = Pattern.compile("\\b([A-Z])(?:\\s*,\\s*[A-Z])*\\b");
    static final Pattern BRACKET_CHOICE = Pattern.compile("[（(]([A-Z])[）)]");

    static String firstMatch(String input, Pattern pattern) {
        if (input == null || pattern == null) return null;
        Matcher matcher = pattern.matcher(input);
        return matcher.find() ? matcher.group(0) : null;
    }

    static String firstGroup(String input, Pattern pattern, int group) {
        if (input == null || pattern == null) return null;
        Matcher matcher = pattern.matcher(input);
        return matcher.find() ? matcher.group(group) : null;
    }
}
