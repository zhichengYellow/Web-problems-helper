package com.webproblemshelper.hunyuan.console.persistence.repo;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.webproblemshelper.hunyuan.console.persistence.entity.QuestionEntity;

@Mapper
public interface QuestionRepository extends BaseMapper<QuestionEntity> {
}
