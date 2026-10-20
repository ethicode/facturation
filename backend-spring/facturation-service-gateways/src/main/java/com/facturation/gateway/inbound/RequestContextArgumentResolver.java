package com.facturation.gateway.inbound;

import com.facturation.api.model.RequestContext;
import com.facturation.core.model.User;
import java.util.List;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** Construit le {@link RequestContext} des endpoints à partir de l'utilisateur authentifié par le jeton JWT. */
public class RequestContextArgumentResolver implements HandlerMethodArgumentResolver {

    private static final RequestContext ANONYMOUS = new RequestContext(null, null, null, null, List.of());

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return RequestContext.class.equals(parameter.getParameterType());
    }

    @Override
    public RequestContext resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ANONYMOUS;
        }
        return new RequestContext(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getRoles());
    }
}
