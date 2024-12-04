#version 330 core
out vec4 FragColor;

struct Material {
    
    sampler2D diffuse;
    sampler2D specular;
    sampler2D emission;
    float shininess;
};

struct DirectionalLight {
    vec3 direction;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight {
    vec3 position;

    float constant;
    float linear;
    float quadratic;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

#define NR_POINT_LIGHTS 4

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

uniform vec3 viewPos;
uniform DirectionalLight directionalLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform Material material;

vec3 CalculateDirectionalLightInfluence(DirectionalLight light, vec3 normal, vec3 viewDirection);
vec3 CalculatePointLightInfluence(PointLight light, vec3 normal, vec3 fragPosition, vec3 viewDirection);

void main()
{
    // properties
    vec3 norm = normalize(Normal);
    vec3 viewDirection = normalize(viewPos - FragPos);

    // directional light
    vec3 result = CalculateDirectionalLightInfluence(directionalLight, norm, viewDirection);

    // point lights
    for(int i = 0; i < NR_POINT_LIGHTS; i++)
        result += CalculatePointLightInfluence(pointLights[i], norm, FragPos, viewDirection);
    
    // result
    FragColor = vec4(result, 1.0);
}

vec3 CalculateDirectionalLightInfluence(DirectionalLight light, vec3 normal, vec3 viewDirection)
{
    vec3 lightDirection = normalize(-light.direction);
    
    // diffuse
    float diff = max(dot(normal, lightDirection), 0.0);
    
    // specular
    vec3 reflectDirection = reflect(-lightDirection, normal);
    float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), material.shininess);
    
    // combine
    vec3 ambient = light.ambient * texture(material.diffuse, TexCoords).rgb;
    vec3 diffuse = light.diffuse * diff * texture(material.diffuse, TexCoords).rgb;
    vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb;

    return (ambient + diffuse + specular);
}

vec3 CalculatePointLightInfluence(PointLight light, vec3 normal, vec3 fragPosition, vec3 viewDirection)
{
    vec3 lightDirection = normalize(light.position - fragPosition);

    // diffuse
    float diff = max(dot(normal, lightDirection), 0.0);

    // specular
    vec3 reflectDirection = reflect(-lightDirection, normal);
    float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), material.shininess);

    // attenuation
    float distance = length(light.position - fragPosition);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

    // combine
    vec3 ambient = light.ambient * texture(material.diffuse, TexCoords).rgb;
    vec3 diffuse = light.diffuse * diff * texture(material.diffuse, TexCoords).rgb;
    vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb;

    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;

    return (ambient + diffuse + specular);
}